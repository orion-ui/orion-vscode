import * as vscode from 'vscode';
import { toKebabCase, toPascalCase } from '../utils/string.utils';
import { searchGlobalAsync } from '../utils/workspace.utils';

export class OrionComponentLocator {

	constructor (private componentName?: string, private parentSrcUri?: vscode.Uri) {}

	setComponentName (name: string) {
		this.componentName = name;
	}

	setParentSrcUri (uri: vscode.Uri) {
		this.parentSrcUri = uri;
	}

	async findComponentUsagesAsync () {
		if (!this.componentName || !this.parentSrcUri) return [];

		const activeFileUri = vscode.window.activeTextEditor?.document.uri.fsPath;
		const usages: Utils.UsageLocation[] = [];

		const componentNamePascalCase = toPascalCase(this.componentName);
		const componentNameKebabCase = toKebabCase(this.componentName);

		const searchPattern = new RegExp(`(?:\\b${componentNamePascalCase}\\b|<${componentNameKebabCase})\\b`, 'g');
		const results = await searchGlobalAsync(
			searchPattern,
			new vscode.RelativePattern(this.parentSrcUri.fsPath, '**/*.{vue,js,ts}'),
			async (uri) => {
				if (uri.fsPath === activeFileUri) return false; // Exclude the active file itself

				const document = await vscode.workspace.openTextDocument(uri);
				return document.getText().includes(componentNamePascalCase + '.vue'); // Quick check to filter files that likely import the component
			},
		);

		results.forEach((result) => {
			usages.push({
				uri: result.uri,
				text: result.text,
				line: result.line,
				start: result.start,
				end: result.end,
			});
		});

		return usages;

	}

}
