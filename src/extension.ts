import * as vscode from 'vscode';
import { SetupHighlightProvider } from './providers/OrionSetupHighlightProvider';
import { OrionComponentUsageProvider } from './providers/OrionComponentUsageProvider';

export function activate (context: vscode.ExtensionContext): void {
	try {
		new SetupHighlightProvider(context);
		new OrionComponentUsageProvider(context);
	}
	catch (error) {
		// eslint-disable-next-line no-console
		console.error('Failed to activate Orion UI Companion.', error);
		vscode.window.showErrorMessage('Failed to activate Orion UI Companion. Check the console for details.');
	}
}

export function deactivate (): void {}
