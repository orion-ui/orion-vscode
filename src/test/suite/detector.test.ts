import assert from 'assert';
import { suite, test } from 'mocha';
import { detectOrionComponents } from '../../core/orionComponentDetector';

suite('Orion component detection', () => {
	test('detects Orion components in Vue SFC', () => {
		const sfc = `
<template>
  <div>
    <OrionButton />
    <custom-widget />
  </div>
</template>
<script setup>
const foo = 1;
</script>
`;

		const result = detectOrionComponents(sfc, new Set(['orion-button']));
		assert.deepStrictEqual(result.components, ['orion-button']);
	});
});
