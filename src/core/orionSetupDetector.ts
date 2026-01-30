import { parse as parseSfc } from '@vue/compiler-sfc';

// eslint-disable-next-line orion-rules/no-export-type-in-ts
export type SetupTokenSection = 'template' | 'script';

export interface SetupTokenMatch {
	offset: number
	length: number
	section: SetupTokenSection
}

const SETUP_TOKEN = 'setup';

const collectTemplateMatches = (content: string, baseOffset: number): SetupTokenMatch[] => {
	const matches: SetupTokenMatch[] = [];
	const regex = /\bsetup\./g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		matches.push({
			offset: baseOffset + match.index,
			length: SETUP_TOKEN.length,
			section: 'template',
		});
	}
	return matches;
};

const collectScriptMatches = (content: string, baseOffset: number): SetupTokenMatch[] => {
	const matches: SetupTokenMatch[] = [];
	const regex = /\bconst\s+setup\s*=/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		const setupIndex = match[0].indexOf(SETUP_TOKEN);
		matches.push({
			offset: baseOffset + match.index + setupIndex,
			length: SETUP_TOKEN.length,
			section: 'script',
		});
	}
	return matches;
};

export const detectSetupTokens = (sfcContent: string): SetupTokenMatch[] => {
	const { descriptor } = parseSfc(sfcContent);
	const matches: SetupTokenMatch[] = [];

	if (descriptor.template?.content && descriptor.template.loc) {
		matches.push(
			...collectTemplateMatches(
				descriptor.template.content,
				descriptor.template.loc.start.offset,
			),
		);
	}

	if (descriptor.script?.content && descriptor.script.loc) {
		matches.push(
			...collectScriptMatches(
				descriptor.script.content,
				descriptor.script.loc.start.offset,
			),
		);
	}

	if (descriptor.scriptSetup?.content && descriptor.scriptSetup.loc) {
		matches.push(
			...collectScriptMatches(
				descriptor.scriptSetup.content,
				descriptor.scriptSetup.loc.start.offset,
			),
		);
	}

	return matches;
};

export const findSetupTokenAtOffset = (sfcContent: string, offset: number): SetupTokenMatch | null => {
	const matches = detectSetupTokens(sfcContent);
	return matches.find(match => offset >= match.offset && offset <= match.offset + match.length) ?? null;
};
