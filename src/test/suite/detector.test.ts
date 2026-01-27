import assert from 'assert';
import { suite, test } from 'mocha';
import { detectOrionComponents } from '../../core/orionComponentDetector';
import { detectSetupTokens } from '../../core/orionSetupDetector';

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

	test('detects setup token in template section', () => {
		const sfc = `
<template>
  <div>{{ setup.title }}</div>
  <div>{{ setupValue }}</div>
</template>
<script>
const value = 1;
</script>
`;

		const matches = detectSetupTokens(sfc).filter(match => match.section === 'template');
		assert.strictEqual(matches.length, 1);
		const match = matches[0];
		assert.strictEqual(sfc.slice(match.offset, match.offset + match.length), 'setup');
	});

	test('detects setup token in script section', () => {
		const sfc = `
<template>
  <div />
</template>
<script>
const setup = useSomething();
const setupper = 2;
</script>
`;

		const matches = detectSetupTokens(sfc).filter(match => match.section === 'script');
		assert.strictEqual(matches.length, 1);
		const match = matches[0];
		assert.strictEqual(sfc.slice(match.offset, match.offset + match.length), 'setup');
	});
});
