import type { OrionComponentDocs, OrionPropDoc } from './orionDocsService';

type ComponentNode = { type: 'component', name: string };
type PropNode = { type: 'prop', componentName: string, prop: OrionPropDoc };
type EmptyNode = { type: 'empty', componentName: string, message: string };
type PropDescriptionNode = { type: 'propDescription', componentName: string, propName: string, description: string };

export type OrionTreeNode = ComponentNode | PropNode | EmptyNode | PropDescriptionNode;

export const buildComponentNodes = (components: string[]): ComponentNode[] => {
	return components.map(component => ({ type: 'component', name: component }));
};

export const buildPropNodes = (componentName: string, docs: OrionComponentDocs | null): Array<PropNode | EmptyNode> => {
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
};

export const buildPropDescriptionNode = (componentName: string, prop: OrionPropDoc): PropDescriptionNode | EmptyNode => {
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
};

export const isEmptyNode = (node: OrionTreeNode): node is EmptyNode => {
	return node.type === 'empty';
};
