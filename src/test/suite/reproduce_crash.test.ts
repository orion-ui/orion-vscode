import assert from 'assert';
import { suite, test } from 'mocha';
import { OrionComponentDetector } from '../../core/OrionComponentDetector';

suite('Orion crash reproduction', () => {
	test('does not crash on malformed Vue template (missing end tag)', () => {
		const sfc = `
<template>
  <div>
    <OrionButton>
  </div>
</template>
`;
		try {
			OrionComponentDetector.detectOrionComponents(sfc, new Set(['orion-button']));
			// If it doesn't throw, we are good (or the issue is elsewhere)
			assert.ok(true, 'Did not crash');
		}
		catch (error: any) {
			assert.fail(`Crashed with error: ${error.message}`);
		}
	});
});
