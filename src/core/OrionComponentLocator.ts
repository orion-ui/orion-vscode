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

		const activeFileUri = vscode.window.activeTextEditor?.document.uri;
		const componentNamePascalCase = toPascalCase(this.componentName);
		const componentNameKebabCase = toKebabCase(this.componentName);

		const searchPattern = new RegExp(`(?:\\b${componentNamePascalCase}\\b|<${componentNameKebabCase}\\b[^-])`);
		const results = await searchGlobalAsync(
			searchPattern,
			new vscode.RelativePattern(this.parentSrcUri.fsPath, '**/*.{vue,js,ts}'),
			'**/node_modules/**',
			activeFileUri,
			{
				fileContentFilter: (content, fileUri) => {
					if (fileUri.fsPath.match(/\.(ts|js)$/)) {
						return content.includes(`${componentNamePascalCase}.vue`);
					}
					return true;
				},
			},
		);

		return results;
	}

}
