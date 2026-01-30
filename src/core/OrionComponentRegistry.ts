import * as vscode from 'vscode';
import type { ExtensionContext } from 'vscode';
import defaultComponents from '../data/orion-components.json';

export class OrionComponentRegistry {

	static getCanonicalComponents (): Set<string> {
		const configured = vscode.workspace
			.getConfiguration('orion')
			.get<string[]>('componentsList', []);

		const list = configured.length > 0 ? configured : defaultComponents;
		return new Set(list.map(item => item.toLowerCase()));
	}

	static registerComponentsConfigWatcher (context: ExtensionContext, onChange: () => void): void {
		const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('orion.componentsList')) {
				onChange();
			}
		});

		context.subscriptions.push(disposable);
	}

}
