import * as ts from 'typescript';
import type * as vscode from 'vscode';

export class ServiceImplementationScanner {

	/**
	 * Scans the document for implemented API methods using AST and the // @api-method: ApiName.MethodName comment pattern.
	 */
	static async getImplementedMethodsAsync (document: vscode.TextDocument): Promise<Set<string>> {
		const text = document.getText();
		const implementedMethods = new Set<string>();

		// 1. Scan for comments (Regex is fine/better for loose comments)
		const apiMethodRegex = /\/\/\s*@api-method:\s*([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)/g;
		let match;
		while ((match = apiMethodRegex.exec(text)) !== null) {
			implementedMethods.add(match[1]);
		}

		// 2. Scan for actual usage using AST
		const sourceFile = ts.createSourceFile(
			document.fileName,
			text,
			ts.ScriptTarget.Latest,
			true,
		);

		const visit = (node: ts.Node) => {
			if (ts.isCallExpression(node)) {
				const expression = node.expression;
				if (ts.isPropertyAccessExpression(expression)) {
					// Check for ApiName.methodName pattern
					// expression.expression is the object (ApiName)
					// expression.name is the property (methodName)
					const objectName = expression.expression.getText(sourceFile);
					const methodName = expression.name.getText(sourceFile);

					if (/^[A-Z]/.test(objectName)) {
						implementedMethods.add(`${objectName}.${methodName}`);
					}
				}
			}
			ts.forEachChild(node, visit);
		};

		visit(sourceFile);

		return implementedMethods;
	}

	/**
	 * Checks if the document is an Orion Service file.
	 */
	static isServiceFile (document: vscode.TextDocument): boolean {
		return document.fileName.endsWith('Service.ts') && document.uri.fsPath.includes('src/services');
	}

}
