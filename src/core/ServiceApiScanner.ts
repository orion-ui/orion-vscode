import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface ApiMethod {
	name: string
	params: string
	returnType: string
	fullSignature: string
}

export interface ApiFile {
	name: string
	path: string
	methods: ApiMethod[]
	isDefaultExport: boolean
}

export class ServiceApiScanner {

	/**
	 * Scans the workspace for *Api.ts files in src/api
	 */
	static async scanForApisAsync (): Promise<ApiFile[]> {
		const files = await vscode.workspace.findFiles('src/api/**/*Api.ts');
		const apiFiles: ApiFile[] = [];

		for (const file of files) {
			try {
				const content = await fs.promises.readFile(file.fsPath, 'utf8');
				const methods = this.extractMethods(content);
				apiFiles.push({
					name: path.basename(file.fsPath, '.ts'),
					path: file.fsPath,
					methods,
					isDefaultExport: content.includes('export default class'),
				});
			}
			catch (err) {
				// eslint-disable-next-line no-console
				console.error(`Failed to read API file ${file.fsPath}:`, err);
			}
		}

		return apiFiles.sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Extracts static methods from an API class
	 */
	private static extractMethods (content: string): ApiMethod[] {
		const methods: ApiMethod[] = [];
		// Regex to find: static [async] methodName(params) [: returnType]
		// Supports basic signatures. For more complex ones, an AST parser would be better.
		const methodRegex = /static\s+(async\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(:\s*([^{]+))?/g;

		let match;
		while ((match = methodRegex.exec(content)) !== null) {
			const name = match[2];
			const params = match[3].trim();
			const returnType = match[5]?.trim() || 'any';
			const fullSignature = match[0].split('{')[0].trim();

			methods.push({
				name,
				params,
				returnType,
				fullSignature,
			});
		}
		return methods;
	}

}
