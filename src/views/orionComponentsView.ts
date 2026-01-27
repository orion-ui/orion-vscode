import * as vscode from 'vscode';
import type { OrionDocsProvider } from '../providers/OrionDocsProvider';
import { buildPropDescriptionNode, buildPropNodes, isEmptyNode } from '../core/orionComponentsTreeModel';
import type { OrionPropDoc } from '../core/orionDocsService';

type OrionTreeItem = OrionComponentItem | OrionPropItem | OrionPropDescriptionItem | OrionEmptyItem;

export class OrionComponentsViewProvider implements vscode.TreeDataProvider<OrionTreeItem> {

	private readonly _onDidChangeTreeData = new vscode.EventEmitter<OrionTreeItem | undefined>();

	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private components: string[] = [];
	private expandedComponents = new Set<string>();

	constructor (private readonly docsProvider: OrionDocsProvider) {}

	refresh (): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	setComponents (components: string[]): void {
		this.components = components;
		this.expandedComponents = new Set(
			components.filter(component => this.expandedComponents.has(component)),
		);
		this.refresh();
	}

	setComponentExpanded (componentName: string, expanded: boolean): void {
		if (expanded) {
			this.expandedComponents.add(componentName);
		}
		else {
			this.expandedComponents.delete(componentName);
		}
	}

	getTreeItem (element: OrionTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren (element?: OrionTreeItem): Promise<OrionTreeItem[]> {
		if (!element) {
			if (this.components.length === 0) {
				const empty = new OrionEmptyItem('No Orion components detected');
				empty.iconPath = new vscode.ThemeIcon('circle-slash');
				return Promise.resolve([empty]);
			}

			return Promise.resolve(this.components.map(
				component =>
					new OrionComponentItem(
						component,
						this.expandedComponents.has(component),
					),
			));
		}

		if (element instanceof OrionComponentItem) {
			return this.docsProvider.getDocsAsync(element.componentName).then((docs) => {
				const propNodes = buildPropNodes(element.componentName, docs);

				return propNodes.map(node =>
					isEmptyNode(node)
						? new OrionEmptyItem(node.message)
						: new OrionPropItem(node.componentName, node.prop),
				);
			});
		}

		if (element instanceof OrionPropItem) {
			const detailNode = buildPropDescriptionNode(
				element.componentName,
				element.prop,
			);

			if (detailNode.type === 'empty') {
				return Promise.resolve([new OrionEmptyItem(detailNode.message)]);
			}

			return Promise.resolve([
				new OrionPropDescriptionItem(
					element.componentName,
					element.prop.name,
					detailNode.description,
				),
			]);
		}

		return Promise.resolve([]);
	}

}

export class OrionComponentItem extends vscode.TreeItem {

	constructor (public readonly componentName: string, expanded: boolean) {
		super(
			componentName,
			expanded
				? vscode.TreeItemCollapsibleState.Expanded
				: vscode.TreeItemCollapsibleState.Collapsed,
		);
		this.contextValue = 'orionComponent';
		this.id = `orionComponent:${componentName}`;
		this.iconPath = new vscode.ThemeIcon('symbol-class');
	}

}

export class OrionPropItem extends vscode.TreeItem {

	constructor (public readonly componentName: string, public readonly prop: OrionPropDoc) {
		super(prop.name, vscode.TreeItemCollapsibleState.Collapsed);
		this.description = prop.type ?? '';
		this.tooltip = prop.description
			? `${prop.name}${prop.type ? `: ${prop.type}` : ''}\n${prop.description}`
			: `${prop.name}${prop.type ? `: ${prop.type}` : ''}`;
		this.contextValue = 'orionProp';
		this.id = `orionProp:${componentName}:${prop.name}`;
		this.iconPath = new vscode.ThemeIcon('symbol-property');
	}

}

export class OrionPropDescriptionItem extends vscode.TreeItem {

	constructor (public readonly componentName: string, public readonly propName: string, description: string) {
		super(description, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'orionPropDescription';
		this.tooltip = description;
		this.id = `orionPropDescription:${componentName}:${propName}`;
		this.iconPath = new vscode.ThemeIcon('comment');
	}

}

export class OrionEmptyItem extends vscode.TreeItem {

	constructor (message: string) {
		super(message, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'orionEmpty';
	}

}
