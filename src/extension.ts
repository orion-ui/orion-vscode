import * as vscode from 'vscode';
import { SetupHighlightProvider } from './providers/OrionSetupHighlightProvider';

export function activate (context: vscode.ExtensionContext): void {
	try {
		new SetupHighlightProvider(context);
	}
	catch (error) {
		// eslint-disable-next-line no-console
		console.error('Failed to activate Orion UI Companion.', error);
		vscode.window.showErrorMessage('Failed to activate Orion UI Companion. Check the console for details.');
	}
}

export function deactivate (): void {}
