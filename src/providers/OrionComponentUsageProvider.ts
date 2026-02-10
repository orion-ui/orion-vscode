import * as vscode from 'vscode';
import { isVueDocument } from '../utils/language.utils';
import { getParentSrcUri } from '../utils/workspace.utils';
import { OrionComponentLocator } from '../core/OrionComponentLocator';

export class OrionComponentUsageProvider {

	private readonly targetView = 'orion.componentUsageView';
	private activeFileUri: vscode.Uri | null = null;
	private parentSrcUri: vscode.Uri | null = null;
	private orionComponentLocator = new OrionComponentLocator();
	private treeProvider = new OrionComponentUsageTreeProvider();

	private get activeFileName () {
		return this.activeFileUri
			?.path.split('/').pop()
			?.replace('.vue', '');
	}

	constructor (private context: vscode.ExtensionContext) {
		this.register();
		this.processAsync();
	}

	private register () {
		this.context.subscriptions.push(
			vscode.commands.registerCommand('orion.openComponentUsageBeside', (usage: Component.UsageLineNode) => this.openComponentUsageBeside(usage)),
			vscode.window.registerTreeDataProvider(this.targetView, this.treeProvider),
			vscode.window.onDidChangeActiveTextEditor(() => this.processAsync()),
		);
	}

	private openComponentUsageBeside (usage: Component.UsageLineNode) {
		const range = new vscode.Range(usage.line, usage.start, usage.line, usage.end);
		const selection = new vscode.Selection(range.start, range.end);
		vscode.window.showTextDocument(usage.uri, {
			viewColumn: vscode.ViewColumn.Beside,
			preserveFocus: true,
			preview: true,
			selection,
		});
	}

	private async processAsync () {
		this.setActiveFileUri();
		this.setParentSrcUri();

		if (!this.activeFileUri || !this.parentSrcUri) {
			this.treeProvider.refresh([]);
			return;
		}

		this.orionComponentLocator.setComponentName(this.activeFileName!);
		this.orionComponentLocator.setParentSrcUri(this.parentSrcUri!);
		const usages = await this.orionComponentLocator.findComponentUsagesAsync();
		this.treeProvider.refresh(usages);
	}

	private setActiveFileUri () {
		const editor = vscode.window.activeTextEditor;
		if (editor && isVueDocument(editor.document)) {
			this.activeFileUri = editor.document.uri;
		}
		else {
			this.activeFileUri = null;
		}
	}

	private setParentSrcUri () {
		if (!this.activeFileUri) {
			this.parentSrcUri = null;
			return;
		}

		this.parentSrcUri = getParentSrcUri(this.activeFileUri);
	}

}

type UsageNode = Component.UsageFileNode | Component.UsageLineNode;
class OrionComponentUsageTreeProvider implements vscode.TreeDataProvider<UsageNode> {

	private fileNodes: Component.UsageFileNode[] = [];
	private _onDidChangeTreeData: vscode.EventEmitter<UsageNode | undefined | null | void> = new vscode.EventEmitter<UsageNode | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<UsageNode | undefined | null | void> = this._onDidChangeTreeData.event;

	refresh (usages: Utils.UsageLocation[]) {
		this.fileNodes = this.buildFileNodes(usages);
		this._onDidChangeTreeData.fire();
	}

	getTreeItem (element: UsageNode): vscode.TreeItem {
		if (element.kind === 'file') {
			const item = new vscode.TreeItem(
				element.label,
				this.fileNodes.length > 3
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.Expanded,
			);
			item.contextValue = 'orionComponentUsageItem.file';
			item.resourceUri = element.uri;
			item.command = {
				command: 'vscode.open',
				title: 'Open',
				arguments: [element.uri],
			};
			return item;
		}

		const item = new vscode.TreeItem(`Line ${element.line + 1}`, vscode.TreeItemCollapsibleState.None);
		item.description = element.text;
		item.contextValue = 'orionComponentUsageItem.line';
		item.command = {
			command: 'vscode.open',
			title: 'Open',
			arguments: [element.uri, { selection: new vscode.Range(element.line, 0, element.line, 0) }],
		};
		return item;
	}

	getChildren (element?: UsageNode): UsageNode[] {
		if (!element) return this.fileNodes;
		if (element.kind === 'file') return element.children;
		return [];
	}

	private buildFileNodes (usages: Utils.UsageLocation[]): Component.UsageFileNode[] {
		const fileMap = new Map<string, Component.UsageFileNode>();

		for (const usage of usages) {
			const key = usage.uri.fsPath;
			const existing = fileMap.get(key);
			const fileNode = existing ?? {
				kind: 'file',
				uri: usage.uri,
				label: vscode.workspace.asRelativePath(usage.uri, false),
				children: [],
			};

			fileNode.children.push({
				kind: 'line',
				...usage,
			});

			fileMap.set(key, fileNode);
		}

		const fileNodes = Array.from(fileMap.values());
		for (const node of fileNodes) {
			node.children.sort((a, b) => a.line - b.line);
		}

		fileNodes.sort((a, b) => a.label.localeCompare(b.label));
		return fileNodes;
	}

}
