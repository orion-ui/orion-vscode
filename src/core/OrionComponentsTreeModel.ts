import type { OrionComponentDocs, OrionPropDoc } from './OrionDocsService';

type ComponentNode = { type: 'component', name: string };
type PropNode = { type: 'prop', componentName: string, prop: OrionPropDoc };
type EmptyNode = { type: 'empty', componentName: string, message: string };
type PropDescriptionNode = { type: 'propDescription', componentName: string, propName: string, description: string };
type UsageSectionNode = { type: 'usageSection', title: string };
type UsageFileNode = { type: 'usageFile', filePath: string, locations: ComponentUsageLocation[] };
type UsageItemNode = { type: 'usageItem', location: ComponentUsageLocation };
type UsageEmptyNode = { type: 'usageEmpty', message: string };

type OrionTreeNode = ComponentNode | PropNode | EmptyNode | PropDescriptionNode | UsageSectionNode | UsageFileNode | UsageItemNode | UsageEmptyNode;

export class OrionComponentsTreeModel {

	static buildComponentNodes (components: string[]): ComponentNode[] {
		return components.map(component => ({ type: 'component', name: component }));
	}

	static buildPropNodes (componentName: string, docs: OrionComponentDocs | null): Array<PropNode | EmptyNode> {
		if (!docs || !docs.props || docs.props.length === 0) {
			return [
				{
					type: 'empty',
					componentName,
					message: 'No props documented.',
				},
			];
		}

		return docs.props.map(prop => ({
			type: 'prop',
			componentName,
			prop,
		}));
	}

	static buildPropDescriptionNode (componentName: string, prop: OrionPropDoc): PropDescriptionNode | EmptyNode {
		const description = prop.description?.trim();

		if (!description) {
			return {
				type: 'empty',
				componentName,
				message: 'No description available.',
			};
		}

		return {
			type: 'propDescription',
			componentName,
			propName: prop.name,
			description,
		};
	}

	static isEmptyNode (node: OrionTreeNode): node is EmptyNode {
		return node.type === 'empty';
	}

	static buildUsageSectionNode (state: UsageSectionState): UsageSectionNode | null {
		if (!state.visible) {
			return null;
		}

		return {
			type: 'usageSection',
			title: 'Component Usage',
		};
	}

	static buildUsageNodes (state: UsageSectionState): Array<UsageFileNode | UsageEmptyNode> {
		if (state.status === 'loading') {
			return [{ type: 'usageEmpty', message: 'Searching for usage locations…' }];
		}

		if (state.status === 'error') {
			return [{ type: 'usageEmpty', message: state.message ?? 'Unable to resolve component usage.' }];
		}

		if (state.locations.length === 0) {
			return [{ type: 'usageEmpty', message: state.message ?? 'No usage locations found.' }];
		}

		const grouped = new Map<string, ComponentUsageLocation[]>();
		for (const location of state.locations) {
			const filePath = location.uri.fsPath ?? location.uri.toString();
			const entries = grouped.get(filePath);
			if (entries) {
				entries.push(location);
			}
			else {
				grouped.set(filePath, [location]);
			}
		}

		return Array.from(grouped.entries())
			.sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
			.map(([filePath, locations]) => ({
				type: 'usageFile',
				filePath,
				locations: locations.sort((left, right) =>
					left.range.start.line === right.range.start.line
						? left.range.start.character - right.range.start.character
						: left.range.start.line - right.range.start.line,
					),
			}));
	}

}
