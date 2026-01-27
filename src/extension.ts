import * as vscode from 'vscode';
import { detectOrionComponents } from './core/orionComponentDetector';
import { getCanonicalComponents,
	registerComponentsConfigWatcher } from './core/orionComponentRegistry';
import { OrionDocsProvider } from './providers/OrionDocsProvider';
import { OrionHoverProvider } from './providers/OrionHoverProvider';
import { OrionComponentItem, OrionComponentsViewProvider } from './views/orionComponentsView';
import { OrionDocsPanel } from './views/orionDocsPanel';

const isVueDocument = (document: vscode.TextDocument): boolean =>
	document.languageId === 'vue' || document.fileName.endsWith('.vue');

export function activate (context: vscode.ExtensionContext): void {
	const docsProvider = new OrionDocsProvider();
	const viewProvider = new OrionComponentsViewProvider(docsProvider);

	const treeView = vscode.window.createTreeView('orionComponentsView', { treeDataProvider: viewProvider });

	context.subscriptions.push(
		treeView,
		treeView.onDidExpandElement((event) => {
			if (event.element instanceof OrionComponentItem) {
				viewProvider.setComponentExpanded(event.element.componentName, true);
			}
		}),
		treeView.onDidCollapseElement((event) => {
			if (event.element instanceof OrionComponentItem) {
				viewProvider.setComponentExpanded(event.element.componentName, false);
			}
		}),
	);

	const updateComponentsForDocument = (document?: vscode.TextDocument): void => {
		if (!document || !isVueDocument(document)) {
			viewProvider.setComponents([]);
			return;
		}

		const canonical = getCanonicalComponents();
		const result = detectOrionComponents(document.getText(), canonical);
		viewProvider.setComponents(result.components);
	};

	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		updateComponentsForDocument(activeEditor.document);
	}

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(
			(editor: vscode.TextEditor | undefined) => {
				updateComponentsForDocument(editor?.document);
			},
		),
	);

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(
			(document: vscode.TextDocument) => {
				updateComponentsForDocument(document);
			},
		),
	);

	registerComponentsConfigWatcher(context, () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			updateComponentsForDocument(editor.document);
		}
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('orion.refreshComponents', () => {
			const editor = vscode.window.activeTextEditor;
			updateComponentsForDocument(editor?.document);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'orion.showComponentDocs',
			async (componentArg: string | { componentName?: string } | undefined) => {
				const componentName
					= typeof componentArg === 'string'
						? componentArg
						: componentArg?.componentName;

				if (!componentName) {
					vscode.window.showErrorMessage('Unable to resolve component name for Orion docs.');
					return;
				}

				const docs = await docsProvider.getDocsAsync(componentName);
				const errorMessage = docs
					? undefined
					: 'Documentation unavailable for this component.';
				OrionDocsPanel.show(componentName, docs, errorMessage);
			},
		),
	);

	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ language: 'vue' },
			new OrionHoverProvider(docsProvider),
		),
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(
			(event: vscode.ConfigurationChangeEvent) => {
				if (
					event.affectsConfiguration('orion.docsSource')
					|| event.affectsConfiguration('orion.docsBaseUrl')
				) {
					docsProvider.clearCache();
				}
			},
		),
	);
}

export function deactivate (): void {}
