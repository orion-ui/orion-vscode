import * as vscode from 'vscode';
import * as ts from 'typescript';
import { type ApiMethod } from './ServiceApiScanner';

export class ServiceCodeManager {

	/**
	 * Implements an API method into the active service file.
	 */
	static async implementMethodAsync (editor: vscode.TextEditor, apiName: string, method: ApiMethod, isDefaultExport: boolean = false): Promise<void> {
		const document = editor.document;
		const text = document.getText();

		const methodName = this.determineMethodName(text, apiName, method);
		const methodCode = this.generateMethodBoilerplate(apiName, method, methodName);
		const importStatement = isDefaultExport
			? `import ${apiName} from '@/api/${apiName}';`
			: `import { ${apiName} } from '@/api/${apiName}';`;

		await editor.edit((editBuilder) => {
			const importRegex = new RegExp(`import\\s+(?:\\{[^}]*\\b${apiName}\\b[^}]*\\}|${apiName})\\s+from`, 'g');
			if (!importRegex.test(text)) {
				const firstImport = text.indexOf('import');
				const pos = firstImport !== -1 ? document.positionAt(firstImport) : new vscode.Position(0, 0);
				editBuilder.insert(pos, `${importStatement}\n`);
			}

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

		const possibleNames = [
			`${methodName}Async`, // Standard
			`${apiName.charAt(0).toLowerCase() + apiName.slice(1)}${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Async`, // Prefixed
		];

		// Strategy 1: Find by marker
		const markerIndex = text.indexOf(marker);
		if (markerIndex !== -1) {
			const rangeWithMarker = this.findMethodRangeByNames(document, possibleNames, marker);
			if (rangeWithMarker) {
				await this.deleteRangeAndCleanImportsAsync(editor, rangeWithMarker.start, rangeWithMarker.end, apiName);
				return;
			}
		}

		// Strategy 2: Find by method signature (fallback for manual implementations)
		const range = this.findMethodRangeByNames(document, possibleNames);
		if (range) {
			await this.deleteRangeAndCleanImportsAsync(editor, range.start, range.end, apiName);
		}
	}

	private static findMethodRangeByNames (
		document: vscode.TextDocument,
		possibleNames: string[],
		marker?: string,
	): { start: number, end: number } | null {
		const text = document.getText();
		const sourceFile = ts.createSourceFile(
			document.fileName,
			text,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);

		const findMethod = (node: ts.Node): ts.MethodDeclaration | null => {
			if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
				const name = node.name.getText(sourceFile);
				if (possibleNames.includes(name)) {
					if (marker) {
						const leadingText = text.slice(node.getFullStart(), node.getStart());
						if (leadingText.includes(marker)) {
							return node;
						}
						// Keep searching for the specific marker match
					}
					else {
						return node;
					}
				}
			}
			return ts.forEachChild(node, findMethod) ?? null;
		};

		const found = findMethod(sourceFile);
		if (!found) return null;
		return { start: found.getFullStart(), end: found.getEnd() };
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

			const textBefore = text.substring(0, startIndex);
			const textAfter = text.substring(endIndex);
			const cleanText = textBefore + textAfter;

			if (
				!cleanText.includes(`// @api-method: ${apiName}.`)
				&& !cleanText.includes(`${apiName}.`) // simplistic usage check
			) {
				const importRegex = new RegExp(`import\\s+(?:\\{[^}]*\\b${apiName}\\b[^}]*\\}|${apiName})\\s+from`, 'g');
				const match = importRegex.exec(cleanText);
				if (match) {
					const importStart = match.index;
					const __lineEnd = cleanText.indexOf('\n', importStart);
					const importEnd = __lineEnd !== -1 ? __lineEnd + 1 : cleanText.length;

					if (importStart < startIndex) {
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
		const returnType = this.normalizeReturnType(method.returnType);
		return `// @api-method: ${apiName}.${method.name}
	static async ${methodName} (${method.params}): ${returnType} {
		return ${apiName}.${method.name}(${this.extractParamNames(method.params)});
	}`;
	}

	private static determineMethodName (text: string, apiName: string, method: ApiMethod): string {
		const baseName = `${method.name}Async`;

		const collisionRegex = new RegExp(`\\b${baseName}\\s*\\(`, 'g');

		if (collisionRegex.test(text)) {
			const apiPrefix = apiName.charAt(0).toLowerCase() + apiName.slice(1);
			const methodSuffix = method.name.charAt(0).toUpperCase() + method.name.slice(1);
			return `${apiPrefix}${methodSuffix}Async`;
		}

		return baseName;
	}

	private static extractParamNames (params: string): string {
		if (!params || !params.trim()) return '';
		const sourceFile = ts.createSourceFile(
			'__temp.ts',
			`function __f(${params}) {}`,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		const statement = sourceFile.statements.find(ts.isFunctionDeclaration);
		if (!statement) return '';
		return statement.parameters
			.map(param => param.name.getText(sourceFile))
			.join(', ');
	}

	private static normalizeReturnType (returnType: string): string {
		const trimmed = returnType.trim();
		if (/^Promise\s*<.+>$/.test(trimmed)) {
			return trimmed;
		}
		return `Promise<${trimmed || 'any'}>`;
	}

	private static findInsertionPosition (document: vscode.TextDocument): vscode.Position {
		const text = document.getText();
		const sourceFile = ts.createSourceFile(
			document.fileName,
			text,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);

		const classDecl = sourceFile.statements.find(ts.isClassDeclaration);
		if (!classDecl) return new vscode.Position(0, 0);

		let constructorNode: ts.ConstructorDeclaration | null = null;
		let lastApiMethod: ts.MethodDeclaration | null = null;

		for (const member of classDecl.members) {
			if (ts.isConstructorDeclaration(member)) {
				constructorNode = member;
			}
			else if (ts.isMethodDeclaration(member)) {
				const ranges = ts.getLeadingCommentRanges(text, member.getFullStart()) ?? [];
				const hasMarker = ranges.some(range =>
					text.slice(range.pos, range.end).includes('// @api-method:'),
				);
				if (hasMarker) {
					lastApiMethod = member;
				}
			}
		}

		const targetNode = lastApiMethod ?? constructorNode;
		if (targetNode) {
			return document.positionAt(targetNode.getEnd());
		}

		const classBraceIndex = text.indexOf('{', classDecl.getStart());
		if (classBraceIndex === -1) return new vscode.Position(0, 0);
		return document.positionAt(classBraceIndex + 1);
	}

}
