import * as vscode from 'vscode';
import { type ApiMethod } from './ServiceApiScanner';

export class ServiceCodeManager {

	/**
	 * Implements an API method into the active service file.
	 */
	static async implementMethodAsync (editor: vscode.TextEditor, apiName: string, method: ApiMethod, isDefaultExport: boolean = false): Promise<void> {
		const document = editor.document;
		const text = document.getText();

		// Prepare boilerplate
		const methodName = this.determineMethodName(text, apiName, method);
		const methodCode = this.generateMethodBoilerplate(apiName, method, methodName);
		// Use alias path for import
		const importStatement = isDefaultExport
			? `import ${apiName} from '@/api/${apiName}';`
			: `import { ${apiName} } from '@/api/${apiName}';`;

		await editor.edit((editBuilder) => {
			// Add import if missing
			// Check if import exists (robust check)
			const importRegex = new RegExp(`import\\s+(?:\\{[^}]*\\b${apiName}\\b[^}]*\\}|${apiName})\\s+from`, 'g');
			if (!importRegex.test(text)) {
				const firstImport = text.indexOf('import');
				const pos = firstImport !== -1 ? document.positionAt(firstImport) : new vscode.Position(0, 0);
				editBuilder.insert(pos, `${importStatement}\n`);
			}

			// Find insertion point (start of class, after constructor if exists)
			const insertionPosition = this.findInsertionPosition(document);
			editBuilder.insert(insertionPosition, `\n\t${methodCode}\n`);
		});

		await document.save();
	}

	/**
	 * Removes an implemented API method from the active service file.
	 */
	static async removeMethodAsync (editor: vscode.TextEditor, apiName: string, methodName: string): Promise<void> {
		const document = editor.document;
		const text = document.getText();
		const marker = `// @api-method: ${apiName}.${methodName}`;

		// Strategy 1: Find by marker
		const startIndex = text.indexOf(marker);

		if (startIndex !== -1) {
			// Find the end of the method block
			let braceCount = 0;
			let methodEndOffset = -1;
			const startSearch = text.indexOf('{', startIndex);
			if (startSearch !== -1) {
				for (let i = startSearch; i < text.length; i++) {
					if (text[i] === '{') braceCount++;
					else if (text[i] === '}') {
						braceCount--;
						if (braceCount === 0) {
							methodEndOffset = i + 1;
							break;
						}
					}
				}
			}

			if (methodEndOffset !== -1) {
				await this.deleteRangeAndCleanImportsAsync(editor, startIndex, methodEndOffset, apiName);
			}
			return;
		}

		// Strategy 2: Find by method signature (fallback for manual implementations)
		// Try: async [prefix]MethodNameAsync (
		// Construct potential names
		const possibleNames = [
			`${methodName}Async`, // Standard
			`${apiName.charAt(0).toLowerCase() + apiName.slice(1)}${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Async`, // Prefixed
		];

		for (const name of possibleNames) {
			// Regex: async name (...
			const regex = new RegExp(`async\\s+${name}\\s*\\(`, 'g');
			const match = regex.exec(text);
			if (match) {
				const startPos = match.index;
				// Find start of line to be clean
				const lineStart = text.lastIndexOf('\n', startPos) + 1;

				// Find closing brace
				let braceCount = 0;
				let foundStartBrace = false;
				let methodEndOffset = -1;

				for (let i = startPos; i < text.length; i++) {
					if (text[i] === '{') {
						braceCount++;
						foundStartBrace = true;
					}
					else if (text[i] === '}') {
						braceCount--;
						if (foundStartBrace && braceCount === 0) {
							methodEndOffset = i + 1;
							break;
						}
					}
				}

				if (methodEndOffset !== -1) {
					await this.deleteRangeAndCleanImportsAsync(editor, lineStart, methodEndOffset, apiName);
					return; // Found and deleted
				}
			}
		}
	}

	private static async deleteRangeAndCleanImportsAsync (
		editor: vscode.TextEditor,
		startIndex: number,
		endIndex: number,
		apiName: string,
	) {
		const document = editor.document;
		const text = document.getText();

		const range = new vscode.Range(
			document.positionAt(startIndex),
			document.positionAt(endIndex),
		);
		await editor.edit((editBuilder) => {
			editBuilder.delete(range);

			// Check if this was the last method for this API
			// We need to simulate the text after deletion to check for conflicts
			// A simple heuristic: check if the api name appears elsewhere in the file (excluding import)
			// But simpler: just check if other @api-method comments or API usages exist?
			// Usages are hard to track accurately without AST after edit.
			// Let's stick to the generated comment pattern or just leave the import if unsure to avoid breaking code.

			// Original logic checked for comments. Now that we support non-comment methods,
			// checking for imports removal is riskier.
			// However, we can perform a safe check:
			// If no other "// @api-method: ApiName." exists AND no "ApiName." usage text exists
			// But "ApiName." might be in the part we just deleted.

			const textBefore = text.substring(0, startIndex);
			const textAfter = text.substring(endIndex);
			const cleanText = textBefore + textAfter;

			if (
				!cleanText.includes(`// @api-method: ${apiName}.`)
				&& !cleanText.includes(`${apiName}.`) // simplistic usage check
			) {
				// Try to find and remove import
				const importRegex = new RegExp(`import\\s+(?:\\{[^}]*\\b${apiName}\\b[^}]*\\}|${apiName})\\s+from`, 'g');
				const match = importRegex.exec(cleanText);
				if (match) {
					const importStart = match.index;
					const __lineEnd = cleanText.indexOf('\n', importStart);
					const importEnd = __lineEnd !== -1 ? __lineEnd + 1 : cleanText.length;

					// We need to map cleanText indices back to original document positions?
					// No, we can just find the import in the original document, provided start index hasn't shifted?
					// Wait, we are in the same edit callback. We can't query the new text easily.
					// BUT we can use the original indices if the import appears BEFORE the deleted method.
					// If it appears AFTER, we need to adjust. Imports are usually at the top.

					if (importStart < startIndex) {
						// Safe to delete using original indices
						editBuilder.delete(new vscode.Range(
							document.positionAt(importStart),
							document.positionAt(importEnd),
						));
					}
				}
			}
		});
		await document.save();
	}

	private static generateMethodBoilerplate (apiName: string, method: ApiMethod, methodName: string): string {
		return `// @api-method: ${apiName}.${method.name}
	static async ${methodName} (${method.params}): Promise<${method.returnType}> {
		return ${apiName}.${method.name}(${this.extractParamNames(method.params)});
	}`;
	}

	private static determineMethodName (text: string, apiName: string, method: ApiMethod): string {
		const baseName = `${method.name}Async`;

		// Check for collision
		// simple check: if the method name appears in the text followed by (
		// A more robust check works be parsing, but simple string matching is often enough for this context
		const collisionRegex = new RegExp(`\\b${baseName}\\s*\\(`, 'g');

		if (collisionRegex.test(text)) {
			// Collision detected, apply prefix
			// ProductApi -> productApi
			const apiPrefix = apiName.charAt(0).toLowerCase() + apiName.slice(1);
			// getDetail -> GetDetail
			const methodSuffix = method.name.charAt(0).toUpperCase() + method.name.slice(1);
			return `${apiPrefix}${methodSuffix}Async`;
		}

		return baseName;
	}

	private static extractParamNames (params: string): string {
		if (!params) return '';
		return params.split(',')
			.map(p => p.split(':')[0].split('=')[0].trim()) // handle default values and types
			.join(', ');
	}

	private static findInsertionPosition (document: vscode.TextDocument): vscode.Position {
		const text = document.getText();
		// Find class opening brace
		const classBraceIndex = text.indexOf('{', text.indexOf('class'));
		if (classBraceIndex === -1) return new vscode.Position(0, 0);

		// Find constructor if exists
		const constructorIndex = text.indexOf('constructor');
		if (constructorIndex !== -1) {
			// Find end of constructor
			let braceCount = 0;
			let started = false;
			for (let i = constructorIndex; i < text.length; i++) {
				if (text[i] === '{') {
					braceCount++;
					started = true;
				}
				else if (text[i] === '}') {
					braceCount--;
					if (started && braceCount === 0) {
						return document.positionAt(i + 1);
					}
				}
			}
		}

		// Find last @api-method to keep them grouped
		const lastApiMethodIndex = text.lastIndexOf('// @api-method:');
		if (lastApiMethodIndex !== -1) {
			// Find end of that method
			let braceCount = 0;
			let started = false;
			for (let i = lastApiMethodIndex; i < text.length; i++) {
				if (text[i] === '{') {
					braceCount++;
					started = true;
				}
				else if (text[i] === '}') {
					braceCount--;
					if (started && braceCount === 0) {
						return document.positionAt(i + 1);
					}
				}
			}
		}

		// Default: after class brace
		return document.positionAt(classBraceIndex + 1);
	}

}
