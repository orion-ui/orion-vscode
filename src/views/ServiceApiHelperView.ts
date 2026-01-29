import * as vscode from 'vscode';
import { ServiceApiScanner, type ApiFile, type ApiMethod } from '../core/ServiceApiScanner';

export class ServiceApiHelperView implements vscode.TreeDataProvider<ApiTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ApiTreeItem | undefined | void> = new vscode.EventEmitter<ApiTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ApiTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private apiFiles: ApiFile[] = [];
	private implementedMethods: Set<string> = new Set(); // Key: ApiName.MethodName
	private extensionUri: vscode.Uri;
	private groupCache: { implemented: ApiFile[], available: ApiFile[] } | undefined;

	constructor (extensionUri: vscode.Uri) {
		this.extensionUri = extensionUri;
	}

	refresh (): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	// eslint-disable-next-line orion-rules/async-suffix
	async getChildren (element?: ApiTreeItem | ApiGroupItem): Promise<(ApiTreeItem | ApiGroupItem)[]> {
		if (!element) {
			this.apiFiles = await ServiceApiScanner.scanForApisAsync();

			const implementedFiles: ApiFile[] = [];
			const availableFiles: ApiFile[] = [];

			for (const file of this.apiFiles) {
				const hasImplementation = file.methods.some(m =>
					this.implementedMethods.has(`${file.name}.${m.name}`),
				);
				if (hasImplementation) {
					implementedFiles.push(file);
				}
				else {
					availableFiles.push(file);
				}
			}

			const items: (ApiTreeItem | ApiGroupItem)[] = [];
			if (implementedFiles.length > 0) {
				items.push(new ApiGroupItem('Implemented APIs', 'implemented'));
			}
			if (availableFiles.length > 0) {
				items.push(new ApiGroupItem('Available APIs', 'available'));
			}

			// If no groups needed (everything in one), maybe just list files?
			// But user asked for sections.
			// To avoid state issues, we store the file lists for the groups
			this.groupCache = { implemented: implementedFiles, available: availableFiles };

			return items;
		}

		if (element instanceof ApiGroupItem) {
			const files = element.status === 'implemented'
				? this.groupCache?.implemented || []
				: this.groupCache?.available || [];
			return files.map(file => new ApiFileItem(
				file,
				element.status === 'implemented'
					? vscode.TreeItemCollapsibleState.Expanded
					: vscode.TreeItemCollapsibleState.Collapsed,
			));
		}

		if (element instanceof ApiFileItem) {
			// Sort methods: implemented first, then alphabetical
			const sortedMethods = [...element.apiFile.methods].sort((a, b) => {
				const aKey = `${element.apiFile.name}.${a.name}`;
				const bKey = `${element.apiFile.name}.${b.name}`;
				const aImpl = this.implementedMethods.has(aKey);
				const bImpl = this.implementedMethods.has(bKey);

				if (aImpl && !bImpl) return -1;
				if (!aImpl && bImpl) return 1;
				return a.name.localeCompare(b.name);
			});

			return sortedMethods.map(method => new ApiMethodItem(
				element.apiFile.name,
				method,
				this.implementedMethods.has(`${element.apiFile.name}.${method.name}`),
				this.extensionUri,
				element.apiFile.isDefaultExport,
			));
		}
		return [];
	}

	getTreeItem (element: ApiTreeItem): vscode.TreeItem {
		return element;
	}

	setImplementedMethods (methods: Set<string>): void {
		this.implementedMethods = methods;
		this.refresh();
	}

}

// eslint-disable-next-line orion-rules/class-name-match-filename
export class ApiFileItem extends vscode.TreeItem {

	constructor (
		public readonly apiFile: ApiFile,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
	) {
		super(apiFile.name, collapsibleState);
		this.iconPath = new vscode.ThemeIcon('symbol-interface');
		this.contextValue = 'apiFile';
		this.id = `apiFile:${apiFile.name}`;
	}

}

// eslint-disable-next-line orion-rules/class-name-match-filename
export class ApiMethodItem extends vscode.TreeItem {

	constructor (
		public readonly apiName: string,
		public readonly method: ApiMethod,
		public readonly isImplemented: boolean,
		public readonly extensionUri: vscode.Uri,
		public readonly isDefaultExport: boolean,
	) {
		super(method.name, vscode.TreeItemCollapsibleState.None);
		this.description = method.params ? `(${method.params})` : '()';
		this.tooltip = `${method.fullSignature}\n\n${isImplemented ? 'Already implemented in current service' : 'Not yet implemented'}`;
		this.contextValue = isImplemented ? 'apiMethodImplemented' : 'apiMethodUnimplemented';

		const iconName = isImplemented ? 'checkbox-checked.svg' : 'checkbox-unchecked.svg';
		this.iconPath = {
			light: vscode.Uri.joinPath(extensionUri, 'resources', iconName),
			dark: vscode.Uri.joinPath(extensionUri, 'resources', iconName),
		};

		this.command = {
			command: isImplemented ? 'orion.removeApiMethod' : 'orion.implementApiMethod',
			title: isImplemented ? 'Remove Method' : 'Implement Method',
			arguments: [this],
		};
	}

}

// eslint-disable-next-line orion-rules/class-name-match-filename
export class ApiGroupItem extends vscode.TreeItem {

	constructor (label: string, public readonly status: 'implemented' | 'available') {
		super(label, vscode.TreeItemCollapsibleState.Expanded);
		this.contextValue = 'apiGroup';
	}

}

// eslint-disable-next-line orion-rules/no-export-type-in-ts
export type ApiTreeItem = ApiFileItem | ApiMethodItem | ApiGroupItem;
