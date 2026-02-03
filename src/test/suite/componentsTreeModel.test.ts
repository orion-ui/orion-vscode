import assert from 'assert';
import { suite, test } from 'mocha';
import { OrionComponentsTreeModel } from '../../core/OrionComponentsTreeModel';

suite('Orion components tree model', () => {
	test('builds component nodes from component list', () => {
		const nodes = OrionComponentsTreeModel.buildComponentNodes(['o-button', 'o-card']);
		assert.deepStrictEqual(nodes.map((node: { name: string }) => node.name), ['o-button', 'o-card']);
	});

	test('returns empty node when no props are documented', () => {
		const nodes = OrionComponentsTreeModel.buildPropNodes('o-button', null);
		assert.strictEqual(nodes[0].type, 'empty');
	});

	test('returns prop nodes with docs props', () => {
		const docs = {
			name: 'o-button',
			props: [{ name: 'variant', type: 'string', description: 'Visual style.' }],
		};
		const nodes = OrionComponentsTreeModel.buildPropNodes('o-button', docs);
		assert.strictEqual(nodes[0].type, 'prop');
		if (nodes[0].type === 'prop') {
			assert.strictEqual(nodes[0].prop.name, 'variant');
			assert.strictEqual(nodes[0].prop.type, 'string');
		}
	});

	test('returns description node when prop has description', () => {
		const detail = OrionComponentsTreeModel.buildPropDescriptionNode('o-button', {
			name: 'variant',
			type: 'string',
			description: 'Visual style.',
		});
		assert.strictEqual(detail.type, 'propDescription');
	});

	test('returns empty node when prop has no description', () => {
		const detail = OrionComponentsTreeModel.buildPropDescriptionNode('o-button', {
			name: 'variant',
			type: 'string',
		});
		assert.strictEqual(detail.type, 'empty');
	});

	test('hides usage section when not visible', () => {
		const node = OrionComponentsTreeModel.buildUsageSectionNode({
			visible: false,
			status: 'idle',
			locations: [],
		});
		assert.strictEqual(node, null);
	});

	test('builds usage nodes when locations exist', () => {
		const nodes = OrionComponentsTreeModel.buildUsageNodes({
			visible: true,
			status: 'ready',
			locations: [{ uri: { fsPath: '/demo.vue', toString: () => 'file:///demo.vue' } as any, range: { start: { line: 0, character: 0 } } as any, lineText: '<Demo />' }],
		});
		assert.strictEqual(nodes[0].type, 'usageFile');
	});

	test('returns empty usage node when no locations', () => {
		const nodes = OrionComponentsTreeModel.buildUsageNodes({
			visible: true,
			status: 'ready',
			locations: [],
		});
		assert.strictEqual(nodes[0].type, 'usageEmpty');
	});
});
