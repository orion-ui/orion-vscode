import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { suite, test } from 'mocha';
import { OrionSetupDocsService, type OrionSetupDocs } from '../../core/OrionSetupDocs';

suite('Orion setup hover markdown', () => {
	test('renders class name and public members only', () => {
		const docs: OrionSetupDocs = {
			className: 'ConsultViewSetup',
			properties: [
				{ name: 'title', type: 'string', visibility: 'public' },
				{ name: 'secret', type: 'string', visibility: 'private' },
			],
			methods: [
				{ name: 'open', type: '(id: string) => void', visibility: 'public' },
				{ name: 'reset', type: '() => void', visibility: 'protected' },
			],
		};

		const markdown = OrionSetupDocsService.buildSetupHoverMarkdown(docs);
		assert.ok(markdown.includes('ConsultViewSetup'));
		assert.ok(markdown.includes('title'));
		assert.ok(markdown.includes('Public properties'));
		assert.ok(markdown.includes('Public methods'));
		assert.ok(markdown.includes('(property) ConsultViewSetup.title: string'));
		assert.ok(markdown.includes('(method) ConsultViewSetup.open(id: string): void'));
		assert.ok(!markdown.includes('secret'));
		assert.ok(!markdown.includes('reset'));
	});
});

suite('Orion setup docs extraction', () => {
	test('extracts setup docs from imported setup class', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orion-setup-'));
		const setupPath = path.join(tempDir, 'MySetup.ts');
		fs.writeFileSync(
			setupPath,
			[
				'export class MySetup {',
				'  public title: string;',
				'  protected cache: number;',
				'  private secret: string;',
				'  open(id: string): void {}',
				'  protected reset(): void {}',
				'}',
			].join('\n'),
			'utf8',
		);

		const sfcPath = path.join(tempDir, 'Component.vue');
		const sfcContent = [
			'<script setup lang="ts">',
			'import { MySetup } from \'./MySetup\';',
			'const setup = new MySetup();',
			'</script>',
			'<template><div>{{ setup.title }}</div></template>',
		].join('\n');
		fs.writeFileSync(sfcPath, sfcContent, 'utf8');

		const docs = OrionSetupDocsService.extractSetupDocsFromSfc(sfcContent, sfcPath, tempDir);
		assert.ok(docs);
		assert.strictEqual(docs?.className, 'MySetup');
		assert.ok(docs?.properties?.some(prop => prop.name === 'title' && prop.visibility === 'public'));
		assert.ok(docs?.properties?.some(prop => prop.name === 'cache' && prop.visibility === 'protected'));
		assert.ok(docs?.properties?.some(prop => prop.name === 'secret' && prop.visibility === 'private'));
		assert.ok(docs?.methods?.some(method => method.name === 'open' && method.visibility === 'public'));
		assert.ok(docs?.methods?.some(method => method.name === 'reset' && method.visibility === 'protected'));
	});

	test('returns null when extraction fails', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orion-setup-missing-'));
		const sfcPath = path.join(tempDir, 'Component.vue');
		const sfcContent = [
			'<script setup lang="ts">',
			'import { MissingSetup } from \'./MissingSetup\';',
			'const setup = new MissingSetup();',
			'</script>',
			'<template><div>{{ setup.title }}</div></template>',
		].join('\n');
		fs.writeFileSync(sfcPath, sfcContent, 'utf8');

		const docs = OrionSetupDocsService.extractSetupDocsFromSfc(sfcContent, sfcPath, tempDir);
		assert.strictEqual(docs, null);
	});
});
