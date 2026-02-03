import * as vscode from 'vscode';
import { OrionComponentDetector } from './core/OrionComponentDetector';
import { OrionComponentRegistry } from './core/OrionComponentRegistry';
import { ServiceCodeManager } from './core/ServiceCodeManager';
import { ServiceImplementationScanner } from './core/ServiceImplementationScanner';
import { OrionDocsProvider } from './providers/OrionDocsProvider';
import { OrionHoverProvider } from './providers/OrionHoverProvider';
import { registerSetupHighlighting } from './providers/OrionSetupHighlightProvider';
import { OrionComponentItem, OrionComponentsViewProvider } from './views/OrionComponentsView';
import { OrionDocPanel } from './views/OrionDocPanel';
import { ServiceApiHelperView } from './views/ServiceApiHelperView';
import { ServiceTemplateService } from './core/ServiceTemplateService';

const isVueDocument = (document: vscode.TextDocument): boolean =>
	document.languageId === 'vue' || document.fileName.endsWith('.vue');

export function activate (context: vscode.ExtensionContext): void {
	try {
		const docsProvider = new OrionDocsProvider();
		const viewProvider = new OrionComponentsViewProvider(docsProvider);
		const apiHelperProvider = new ServiceApiHelperView(context.extensionUri);

		const treeView = vscode.window.createTreeView('orionComponentsView', { treeDataProvider: viewProvider });
		const apiTreeView = vscode.window.createTreeView('orion.serviceApiHelper', { treeDataProvider: apiHelperProvider });

		context.subscriptions.push(
			treeView,
			apiTreeView,
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

			const canonical = OrionComponentRegistry.getCanonicalComponents();
			const result = OrionComponentDetector.detectOrionComponents(document.getText(), canonical);
			viewProvider.setComponents(result.components);
		};

		const updateApiImplementationsAsync = async (editor: vscode.TextEditor | undefined): Promise<void> => {
			if (editor && ServiceImplementationScanner.isServiceFile(editor.document)) {
				const methods = await ServiceImplementationScanner.getImplementedMethodsAsync(editor.document);
				apiHelperProvider.setImplementedMethods(methods);
			}
			else {
				apiHelperProvider.setImplementedMethods(new Set());
			}
		};

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			updateComponentsForDocument(activeEditor.document);
			updateApiImplementationsAsync(activeEditor);
		}

		context.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor(
				(editor: vscode.TextEditor | undefined) => {
					updateComponentsForDocument(editor?.document);
					updateApiImplementationsAsync(editor);
				},
			),
		);

		context.subscriptions.push(
			vscode.workspace.onDidSaveTextDocument(
				(document: vscode.TextDocument) => {
					updateComponentsForDocument(document);
					const editor = vscode.window.activeTextEditor;
					if (editor && editor.document === document) {
						updateApiImplementationsAsync(editor);
					}
				},
			),
		);

		OrionComponentRegistry.registerComponentsConfigWatcher(context, () => {
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
			vscode.commands.registerCommand('orion.refreshApiViews', () => {
				apiHelperProvider.refresh();
			}),
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('orion.createServiceFromTemplate', async (uri?: vscode.Uri) => {
				console.clear();
				console.log('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ');
				await ServiceTemplateService.createServiceFromTemplateAsync(context.extensionUri, uri);
			}),
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('orion.revealApiMethod', async (item: any) => {
				if (typeof item?.method?.start !== 'number' || typeof item?.apiFilePath !== 'string') {
					return;
				}
				const document = await vscode.workspace.openTextDocument(item.apiFilePath);
				const editor = await vscode.window.showTextDocument(document, { preview: false });
				const position = document.positionAt(item.method.start);
				const range = new vscode.Range(position, position);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
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
					OrionDocPanel.show(componentName, docs, errorMessage);
				},
			),
		);

		// Implementation/removal commands
		context.subscriptions.push(
			vscode.commands.registerCommand('orion.implementApiMethod', async (item: any) => {
				const editor = vscode.window.activeTextEditor;
				if (editor && item.method) {
					await ServiceCodeManager.implementMethodAsync(editor, item.apiName, item.method, item.isDefaultExport);
					await updateApiImplementationsAsync(editor);
				}
			}),
			vscode.commands.registerCommand('orion.removeApiMethod', async (item: any) => {
				const editor = vscode.window.activeTextEditor;
				if (editor && item.method) {
					await ServiceCodeManager.removeMethodAsync(editor, item.apiName, item.method.name);
					await updateApiImplementationsAsync(editor);
				}
			}),
		);

		context.subscriptions.push(
			vscode.languages.registerHoverProvider(
				{ language: 'vue' },
				new OrionHoverProvider(docsProvider),
			),
		);

		registerSetupHighlighting(context);

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
	catch (error) {
		// eslint-disable-next-line no-console
		console.error('Failed to activate Orion UI Companion.', error);
		vscode.window.showErrorMessage('Failed to activate Orion UI Companion. Check the console for details.');
	}
}

export function deactivate (): void {}
