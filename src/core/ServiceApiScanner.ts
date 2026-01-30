import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
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
				const sourceFile = ts.createSourceFile(
					file.fsPath,
					content,
					ts.ScriptTarget.Latest,
					true,
				);

				const methods = this.extractMethods(sourceFile, content);
				const isDefaultExport = this.checkDefaultExport(sourceFile);

				apiFiles.push({
					name: path.basename(file.fsPath, '.ts'),
					path: file.fsPath,
					methods,
					isDefaultExport,
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
	 * Extracts static methods from an API class using AST
	 */
	private static extractMethods (sourceFile: ts.SourceFile, content: string): ApiMethod[] {
		const methods: ApiMethod[] = [];

		const visit = (node: ts.Node) => {
			if (ts.isClassDeclaration(node)) {
				node.members.forEach((member) => {
					if (ts.isMethodDeclaration(member) && this.isStatic(member)) {
						const name = member.name.getText(sourceFile);

						const params = member.parameters.map(p => p.getText(sourceFile)).join(', ');

						let returnType = 'any';
						if (member.type) {
							returnType = member.type.getText(sourceFile);
						}

						const start = member.getStart(sourceFile);
						const bodyStart = member.body?.getStart(sourceFile) ?? member.end;
						const declText = content.substring(start, bodyStart).trim();
						const fullSignature = declText.endsWith('{') ? declText.slice(0, -1).trim() : declText;

						methods.push({
							name,
							params,
							returnType,
							fullSignature,
						});
					}
				});
			}
			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
		return methods;
	}

	private static isStatic (member: ts.MethodDeclaration): boolean {
		return member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) ?? false;
	}

	private static checkDefaultExport (sourceFile: ts.SourceFile): boolean {
		let isDefault = false;
		ts.forEachChild(sourceFile, (node) => {
			if (ts.isClassDeclaration(node)) {
				if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) {
					isDefault = true;
				}
			}
			else if (ts.isExportAssignment(node)) {
				isDefault = true;
			}
		});
		return isDefault;
	}

}
