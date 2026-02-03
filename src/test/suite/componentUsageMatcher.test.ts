import assert from 'assert';
import { suite, test } from 'mocha';
import { OrionComponentUsageMatcher } from '../../core/OrionComponentUsageMatcher';

suite('Orion component usage matcher', () => {
	test('finds exact Shared component tag matches only', () => {
		const template = `
<template>
	<SharedMetaButton />
	<SharedMetaButtonVariant />
	<shared-meta-button />
	<shared-meta-button-variant />
</template>
`;

		const pascalMatches = OrionComponentUsageMatcher.findExactTagMatches(template, 'SharedMetaButton');
		const kebabMatches = OrionComponentUsageMatcher.findExactTagMatches(template, 'shared-meta-button');

		assert.strictEqual(pascalMatches.length, 1);
		assert.strictEqual(kebabMatches.length, 1);
	});

	test('detects exact imports for non-shared components', () => {
		const text = `
import MetaButton from './MetaButton.vue';
import { MetaButton, MetaButtonVariant } from './buttons';
import { MetaButtonVariant } from './variants';
`;

		const matches = OrionComponentUsageMatcher.findImportMatchesInText(text, 'MetaButton');
		assert.strictEqual(matches.length, 2);
	});
});
