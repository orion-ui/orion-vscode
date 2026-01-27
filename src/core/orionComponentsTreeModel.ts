import type { OrionComponentDocs, OrionPropDoc } from './orionDocsService';

export const buildComponentNodes = (components: string[]) => {
	return components.map(component => ({ type: 'component' as const, name: component }));
};

export const buildPropNodes = (componentName: string, docs: OrionComponentDocs | null) => {
	if (!docs || !docs.props || docs.props.length === 0) {
		return [
			{
				type: 'empty' as const,
				componentName,
				message: 'No props documented.',
			},
		];
	}

	return docs.props.map(prop => ({
		type: 'prop' as const,
		componentName,
		prop,
	}));
};

export const buildPropDescriptionNode = (componentName: string, prop: OrionPropDoc) => {
	const description = prop.description?.trim();

	if (!description) {
		return {
			type: 'empty' as const,
			componentName,
			message: 'No description available.',
		};
	}

	return {
		type: 'propDescription' as const,
		componentName,
		propName: prop.name,
		description,
	};
};

export const isEmptyNode = (node: { type: string }): node is { type: 'empty' } => {
	return node.type === 'empty';
};
