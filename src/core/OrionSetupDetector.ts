import { parse as parseSfc } from '@vue/compiler-sfc';

// eslint-disable-next-line orion-rules/no-export-type-in-ts
export type SetupTokenSection = 'template' | 'script';

export interface SetupTokenMatch {
	offset: number
	length: number
	section: SetupTokenSection
}

export class OrionSetupDetector {

	private static readonly setupToken = 'setup';

	private static collectTemplateMatches (content: string, baseOffset: number): SetupTokenMatch[] {
		const matches: SetupTokenMatch[] = [];
		const regex = /\bsetup\./g;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			matches.push({
				offset: baseOffset + match.index,
				length: this.setupToken.length,
				section: 'template',
			});
		}
		return matches;
	}

	private static collectScriptMatches (content: string, baseOffset: number): SetupTokenMatch[] {
		const matches: SetupTokenMatch[] = [];
		const regex = /\bconst\s+setup\s*=/g;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			const setupIndex = match[0].indexOf(this.setupToken);
			matches.push({
				offset: baseOffset + match.index + setupIndex,
				length: this.setupToken.length,
				section: 'script',
			});
		}
		return matches;
	}

	static detectSetupTokens (sfcContent: string): SetupTokenMatch[] {
		const { descriptor } = parseSfc(sfcContent);
		const matches: SetupTokenMatch[] = [];

		if (descriptor.template?.content && descriptor.template.loc) {
			matches.push(
				...this.collectTemplateMatches(
					descriptor.template.content,
					descriptor.template.loc.start.offset,
				),
			);
		}

		if (descriptor.script?.content && descriptor.script.loc) {
			matches.push(
				...this.collectScriptMatches(
					descriptor.script.content,
					descriptor.script.loc.start.offset,
				),
			);
		}

		if (descriptor.scriptSetup?.content && descriptor.scriptSetup.loc) {
			matches.push(
				...this.collectScriptMatches(
					descriptor.scriptSetup.content,
					descriptor.scriptSetup.loc.start.offset,
				),
			);
		}

		return matches;
	}

	static findSetupTokenAtOffset (sfcContent: string, offset: number): SetupTokenMatch | null {
		const matches = this.detectSetupTokens(sfcContent);
		return matches.find(match => offset >= match.offset && offset <= match.offset + match.length) ?? null;
	}

}
