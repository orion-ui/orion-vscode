import type * as vscode from 'vscode';

export class ServiceImplementationScanner {

	/**
	 * Scans the document for implemented API methods using the // @api-method: ApiName.MethodName comment pattern.
	 */
	static async getImplementedMethodsAsync (document: vscode.TextDocument): Promise<Set<string>> {
		const text = document.getText();
		const implementedMethods = new Set<string>();
		// Regex to find: // @api-method: ApiName.MethodName
		const apiMethodRegex = /\/\/\s*@api-method:\s*([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)/g;
		let match;
		while ((match = apiMethodRegex.exec(text)) !== null) {
			implementedMethods.add(match[1]);
		}

		// Also scan for actual usage: ApiName.methodName(
		const usageRegex = /([A-Z][a-zA-Z0-9_]*)\.([a-zA-Z0-9_]+)\s*\(/g;
		while ((match = usageRegex.exec(text)) !== null) {
			implementedMethods.add(`${match[1]}.${match[2]}`);
		}
		return implementedMethods;
	}

	/**
	 * Checks if the document is an Orion Service file.
	 */
	static isServiceFile (document: vscode.TextDocument): boolean {
		return document.fileName.endsWith('Service.ts') && document.uri.fsPath.includes('src/services');
	}

}
