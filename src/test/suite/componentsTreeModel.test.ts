import assert from 'assert';
import { suite, test } from 'mocha';
import { buildComponentNodes, buildPropDescriptionNode, buildPropNodes } from '../../core/orionComponentsTreeModel';

suite('Orion components tree model', () => {
	test('builds component nodes from component list', () => {
		const nodes = buildComponentNodes(['o-button', 'o-card']);
		assert.deepStrictEqual(nodes.map(node => node.name), ['o-button', 'o-card']);
	});

	test('returns empty node when no props are documented', () => {
		const nodes = buildPropNodes('o-button', null);
		assert.strictEqual(nodes[0].type, 'empty');
	});

	test('returns prop nodes with docs props', () => {
		const docs = {
			name: 'o-button',
			props: [{ name: 'variant', type: 'string', description: 'Visual style.' }],
		};
		const nodes = buildPropNodes('o-button', docs);
		assert.strictEqual(nodes[0].type, 'prop');
		if (nodes[0].type === 'prop') {
			assert.strictEqual(nodes[0].prop.name, 'variant');
			assert.strictEqual(nodes[0].prop.type, 'string');
		}
	});

	test('returns description node when prop has description', () => {
		const detail = buildPropDescriptionNode('o-button', {
			name: 'variant',
			type: 'string',
			description: 'Visual style.',
		});
		assert.strictEqual(detail.type, 'propDescription');
	});

	test('returns empty node when prop has no description', () => {
		const detail = buildPropDescriptionNode('o-button', {
			name: 'variant',
			type: 'string',
		});
		assert.strictEqual(detail.type, 'empty');
	});
});
