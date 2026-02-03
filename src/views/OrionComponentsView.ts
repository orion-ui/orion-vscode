import * as vscode from 'vscode';
import { OrionComponentsTreeModel } from '../core/OrionComponentsTreeModel';
import type { OrionPropDoc } from '../core/OrionDocsService';
import type { OrionDocsProvider } from '../providers/OrionDocsProvider';

type OrionTreeItem = OrionComponentItem | OrionPropItem | OrionPropDescriptionItem | OrionUsageSectionItem | OrionUsageFileItem | OrionUsageItem | OrionEmptyItem;

export class OrionComponentsViewProvider implements vscode.TreeDataProvider<OrionTreeItem> {

	private readonly _onDidChangeTreeData = new vscode.EventEmitter<OrionTreeItem | undefined>();

	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private components: string[] = [];
	private expandedComponents = new Set<string>();
	private usageState: UsageSectionState = {
		visible: false,
		status: 'idle',
		locations: [],
	};

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

	setUsageHidden (): void {
		this.usageState = {
			visible: false,
			status: 'idle',
			locations: [],
		};
		this.refresh();
	}

	setUsageLoading (message?: string): void {
		this.usageState = {
			visible: true,
			status: 'loading',
			message,
			locations: [],
		};
		this.refresh();
	}

	setUsageResults (locations: ComponentUsageLocation[], message?: string): void {
		this.usageState = {
			visible: true,
			status: 'ready',
			message,
			locations,
		};
		this.refresh();
	}

	setUsageError (message: string): void {
		this.usageState = {
			visible: true,
			status: 'error',
			message,
			locations: [],
		};
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
			const usageSection = OrionComponentsTreeModel.buildUsageSectionNode(this.usageState);
			const usageItems = usageSection
				? [new OrionUsageSectionItem(usageSection.title)]
				: [];

			if (this.components.length === 0) {
				const empty = new OrionEmptyItem('No Orion components detected');
				empty.iconPath = new vscode.ThemeIcon('circle-slash');
				return Promise.resolve([...usageItems, empty]);
			}

			return Promise.resolve([
				...usageItems,
				...this.components.map(
					component =>
						new OrionComponentItem(
							component,
							this.expandedComponents.has(component),
						),
				),
			]);
		}

		if (element instanceof OrionUsageSectionItem) {
			const usageNodes = OrionComponentsTreeModel.buildUsageNodes(this.usageState);
			return Promise.resolve(usageNodes.map(node =>
				node.type === 'usageEmpty'
					? new OrionEmptyItem(node.message)
					: new OrionUsageFileItem(node.filePath, node.locations),
			));
		}

		if (element instanceof OrionUsageFileItem) {
			return Promise.resolve(element.locations.map(location => new OrionUsageItem(location)));
		}

		if (element instanceof OrionComponentItem) {
			return this.docsProvider.getDocsAsync(element.componentName).then((docs) => {
				const propNodes = OrionComponentsTreeModel.buildPropNodes(element.componentName, docs);

				return propNodes.map(node =>
					OrionComponentsTreeModel.isEmptyNode(node)
						? new OrionEmptyItem(node.message)
						: new OrionPropItem(node.componentName, node.prop),
				);
			});
		}

		if (element instanceof OrionPropItem) {
			const detailNode = OrionComponentsTreeModel.buildPropDescriptionNode(
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

export class OrionUsageSectionItem extends vscode.TreeItem {

	constructor (title: string) {
		super(title, vscode.TreeItemCollapsibleState.Expanded);
		this.contextValue = 'orionUsageSection';
		this.id = 'orionUsageSection';
		this.iconPath = new vscode.ThemeIcon('references');
	}

}

export class OrionUsageItem extends vscode.TreeItem {

	constructor (public readonly location: ComponentUsageLocation) {
		super(OrionUsageItem.buildLabel(location), vscode.TreeItemCollapsibleState.None);
		this.description = OrionUsageItem.buildDescription(location);
		this.tooltip = location.lineText;
		this.contextValue = 'orionUsageItem';
		this.id = `orionUsage:${location.uri.toString()}:${location.range.start.line}:${location.range.start.character}`;
		this.iconPath = new vscode.ThemeIcon('location');
		this.command = {
			command: 'orion.revealComponentUsage',
			title: 'Go to Usage',
			arguments: [location],
		};
	}

	private static buildLabel (location: ComponentUsageLocation): string {
		return location.lineText || `Line ${location.range.start.line + 1}`;
	}

	private static buildDescription (location: ComponentUsageLocation): string {
		const lineNumber = location.range.start.line + 1;
		return `Line ${lineNumber}`;
	}

}

export class OrionUsageFileItem extends vscode.TreeItem {

	constructor (public readonly filePath: string, public readonly locations: ComponentUsageLocation[]) {
		super(
			OrionUsageFileItem.buildLabel(filePath),
			locations.length <= 10
				? vscode.TreeItemCollapsibleState.Expanded
				: vscode.TreeItemCollapsibleState.Collapsed,
		);
		this.contextValue = 'orionUsageFile';
		this.id = `orionUsageFile:${filePath}`;
		this.iconPath = vscode.ThemeIcon.File;
	}

	private static buildLabel (filePath: string): string {
		const relativePath = vscode.workspace.asRelativePath(filePath).replace(/\\/g, '/');
		const marker = 'src/';
		const markerIndex = relativePath.indexOf(marker);
		if (markerIndex >= 0) {
			return relativePath.slice(markerIndex + marker.length);
		}
		return relativePath;
	}

}

export class OrionEmptyItem extends vscode.TreeItem {

	constructor (message: string) {
		super(message, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'orionEmpty';
	}

}
