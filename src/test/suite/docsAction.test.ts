import assert from 'assert';
import { suite, test } from 'mocha';
import { readFileSync } from 'fs';
import { join } from 'path';

type CommandContribution = {
	command: string
	title: string
	icon?: { light: string; dark: string }
};

type MenuContribution = {
	command: string
	when?: string
	group?: string
};

type PackageJson = {
	contributes?: {
		commands?: CommandContribution[]
		menus?: {
			'view/item/context'?: MenuContribution[]
		}
	}
};

suite('Orion docs action contribution', () => {
	test('registers inline docs action for component items', () => {
		const packageJsonPath = join(__dirname, '../../../package.json');
		const payload = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
		const commands = payload.contributes?.commands ?? [];
		const menus = payload.contributes?.menus?.['view/item/context'] ?? [];

		const docsCommand = commands.find(cmd => cmd.command === 'orion.showComponentDocs');
		assert.ok(docsCommand, 'Expected orion.showComponentDocs command to be registered');

		const inlineMenu = menus.find(menu =>
			menu.command === 'orion.showComponentDocs'
			&& menu.group === 'inline',
		);
		assert.ok(inlineMenu, 'Expected docs action to be contributed as inline view item action');
	});
});
