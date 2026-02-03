import * as path from 'path';
import * as vscode from 'vscode';
import { OrionComponentDetector } from './core/OrionComponentDetector';
import { OrionComponentRegistry } from './core/OrionComponentRegistry';
import { OrionComponentUsageService } from './core/OrionComponentUsageService';
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

const isPathWithin = (filePath: string, rootPath: string): boolean => {
	const relative = path.relative(rootPath, filePath);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
};

export function activate (context: vscode.ExtensionContext): void {
	try {
		const docsProvider = new OrionDocsProvider();
		const viewProvider = new OrionComponentsViewProvider(docsProvider);
		const apiHelperProvider = new ServiceApiHelperView(context.extensionUri);
		const usageCache = new Map<string, ComponentUsageLocation[]>();
		let usageRefreshTimeout: ReturnType<typeof setTimeout> | undefined;
		let usageSearchTokenSource: vscode.CancellationTokenSource | undefined;
		let activeUsageDocument: vscode.TextDocument | undefined;

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

		const updateUsageForDocumentAsync = async (
			document?: vscode.TextDocument,
			forceRefresh = false,
		): Promise<void> => {
			if (!document || !isVueDocument(document)) {
				viewProvider.setUsageHidden();
				activeUsageDocument = undefined;
				return;
			}

			activeUsageDocument = document;

			const identity = OrionComponentUsageService.resolveComponentIdentity(document);
			if (!identity) {
				viewProvider.setUsageResults([], 'No component context available.');
				return;
			}

			const cacheKey = `${identity.name}:${document.uri.toString()}`;
			if (forceRefresh) {
				usageCache.delete(cacheKey);
			}

			const cached = usageCache.get(cacheKey);
			if (cached) {
				viewProvider.setUsageResults(cached, cached.length === 0 ? 'No usage locations found.' : undefined);
				return;
			}

			usageSearchTokenSource?.cancel();
			usageSearchTokenSource?.dispose();
			usageSearchTokenSource = new vscode.CancellationTokenSource();
			const token = usageSearchTokenSource.token;

			viewProvider.setUsageLoading();

			try {
				const locations = await OrionComponentUsageService.findUsageLocationsAsync(document, token);
				if (token.isCancellationRequested) {
					return;
				}

				usageCache.set(cacheKey, locations);
				if (locations.length === 0) {
					viewProvider.setUsageResults([], 'No usage locations found.');
					return;
				}

				viewProvider.setUsageResults(locations);
			}
			catch (error) {
				if (token.isCancellationRequested) {
					return;
				}

				viewProvider.setUsageError('Unable to resolve component usage.');
			}
		};

		const scheduleUsageRefresh = (document?: vscode.TextDocument, forceRefresh = false): void => {
			if (usageRefreshTimeout) {
				clearTimeout(usageRefreshTimeout);
			}

			usageRefreshTimeout = setTimeout(() => {
				void updateUsageForDocumentAsync(document, forceRefresh);
			}, 250);
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
			scheduleUsageRefresh(activeEditor.document);
			if (isVueDocument(activeEditor.document)) {
				activeUsageDocument = activeEditor.document;
			}
		}

		context.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor(
				(editor: vscode.TextEditor | undefined) => {
					updateComponentsForDocument(editor?.document);
					updateApiImplementationsAsync(editor);
					scheduleUsageRefresh(editor?.document, true);
					if (editor && isVueDocument(editor.document)) {
						activeUsageDocument = editor.document;
					}
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

					const editorDocument = editor?.document;
					const usageDocument = activeUsageDocument ?? (editorDocument && isVueDocument(editorDocument) ? editorDocument : undefined);
					if (!usageDocument) {
						return;
					}

					const searchRoot = OrionComponentUsageService.resolveNearestSrcRoot(usageDocument);
					if (searchRoot && isPathWithin(document.uri.fsPath, searchRoot)) {
						scheduleUsageRefresh(usageDocument, true);
					}
				},
			),
		);

		context.subscriptions.push(
			vscode.workspace.onDidChangeTextDocument(
				(event: vscode.TextDocumentChangeEvent) => {
					const editor = vscode.window.activeTextEditor;
					if (!editor || !isVueDocument(editor.document)) {
						return;
					}

					const searchRoot = OrionComponentUsageService.resolveNearestSrcRoot(editor.document);
					if (!searchRoot) {
						return;
					}

					if (!event.document.uri.fsPath.startsWith(searchRoot)) {
						return;
					}

					scheduleUsageRefresh(editor.document, true);
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
				scheduleUsageRefresh(editor?.document, true);
			}),
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('orion.refreshComponentUsage', () => {
				const editor = vscode.window.activeTextEditor;
				const editorDocument = editor?.document;
				const usageDocument = activeUsageDocument ?? (editorDocument && isVueDocument(editorDocument) ? editorDocument : undefined);
				if (!usageDocument) {
					return;
				}
				scheduleUsageRefresh(usageDocument, true);
			}),
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('orion.refreshApiViews', () => {
				apiHelperProvider.refresh();
			}),
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('orion.createServiceFromTemplate', async (uri?: vscode.Uri) => {
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
			vscode.commands.registerCommand('orion.revealComponentUsage', async (location: ComponentUsageLocation | undefined) => {
				if (!location) {
					return;
				}

				const document = await vscode.workspace.openTextDocument(location.uri.fsPath);
				const editor = await vscode.window.showTextDocument(document, { preview: false });
				const range = new vscode.Range(
					new vscode.Position(location.range.start.line, location.range.start.character),
					new vscode.Position(location.range.end.line, location.range.end.character),
				);
				editor.selection = new vscode.Selection(range.start, range.start);
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
			}),
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('orion.openComponentUsageBeside', async (item: ComponentUsageLocation | { location?: ComponentUsageLocation } | undefined) => {
				const resolvedLocation = item && typeof item === 'object' && 'location' in item
					? (item as { location?: ComponentUsageLocation }).location
					: item as ComponentUsageLocation | undefined;
				if (!resolvedLocation) {
					return;
				}

				const document = await vscode.workspace.openTextDocument(resolvedLocation.uri.fsPath);
				const editor = await vscode.window.showTextDocument(document, {
					preview: false,
					preserveFocus: true,
					viewColumn: vscode.ViewColumn.Beside,
				});
				const range = new vscode.Range(
					new vscode.Position(resolvedLocation.range.start.line, resolvedLocation.range.start.character),
					new vscode.Position(resolvedLocation.range.end.line, resolvedLocation.range.end.character),
				);
				editor.selection = new vscode.Selection(range.start, range.start);
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
