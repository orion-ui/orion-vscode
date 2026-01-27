import defaultComponents from '../data/orion-components.json';
import type { ExtensionContext } from 'vscode';
import * as vscode from 'vscode';

export const getCanonicalComponents = (): Set<string> => {
	const configured = vscode.workspace
		.getConfiguration('orion')
		.get<string[]>('componentsList', []);

	const list = configured.length > 0 ? configured : defaultComponents;
	return new Set(list.map(item => item.toLowerCase()));
};

export const registerComponentsConfigWatcher = (context: ExtensionContext, onChange: () => void): void => {
	const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('orion.componentsList')) {
			onChange();
		}
	});

	context.subscriptions.push(disposable);
};
