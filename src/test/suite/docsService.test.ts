import assert from 'assert';
import { suite, test } from 'mocha';
import { OrionDocsService } from '../../core/OrionDocsService';

suite('Orion docs service', () => {
	test('returns docs from fetcher', async () => {
		const fetcherAsync = async () =>
			({
				ok: true,
				'json': async () => ({ name: 'orion-button', props: [] }),
			} as any);

		const docs = await OrionDocsService.fetchOrionDocsAsync(
			'https://orion-ui.org',
			'orion-button',
			fetcherAsync,
		);

		assert.ok(docs);
		assert.strictEqual(docs?.name, 'orion-button');
	});

	test('returns null on non-ok response', async () => {
		const fetcherAsync = async () => ({ ok: false } as any);

		const docs = await OrionDocsService.fetchOrionDocsAsync(
			'https://orion-ui.org',
			'orion-button',
			fetcherAsync,
		);

		assert.strictEqual(docs, null);
	});
});
