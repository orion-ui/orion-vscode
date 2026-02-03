import * as path from 'path';
import { toKebabCase, toPascalCase } from '../utils/stringUtils';

export class OrionComponentUsageMatcher {

	private static readonly importRegexCache = new Map<string, RegExp>();
	private static readonly importPathRegexCache = new Map<string, RegExp>();

	static resolveComponentIdentityFromFile (filePath: string): ComponentIdentity | null {
		const baseName = path.parse(filePath).name;
		if (!baseName) {
			return null;
		}

		const name = toPascalCase(baseName);
		if (!name) {
			return null;
		}

		return {
			name,
			kebabName: toKebabCase(name),
			isShared: name.startsWith('Shared'),
			fileBaseName: baseName,
		};
	}

	static buildExactTagRegex (tagName: string): RegExp {
		const escaped = this.escapeRegex(tagName);
		return new RegExp(`<${escaped}(?=[\\s>/])`, 'g');
	}

	static buildImportRegex (componentName: string): RegExp {
		const cached = this.importRegexCache.get(componentName);
		if (cached) {
			return cached;
		}

		const escaped = this.escapeRegex(componentName);
		const regex = new RegExp(`import\\s+[^;]*\\b${escaped}\\b[^;]*from\\s+['\"][^'\"]+['\"]`, 'g');
		this.importRegexCache.set(componentName, regex);
		return regex;
	}

	static buildImportPathRegex (fileBaseName: string): RegExp {
		const cached = this.importPathRegexCache.get(fileBaseName);
		if (cached) {
			return cached;
		}

		const escaped = this.escapeRegex(fileBaseName);
		const pathSegment = `(?:/|\\\\)${escaped}(?:\\.vue)?`;
		const directSegment = `${escaped}(?:\\.vue)?`;
		const importFrom = `import\\s+[^;]*from\\s+['\"][^'\"]*(?:${pathSegment})['\"]|import\\s+[^;]*from\\s+['\"]${directSegment}['\"]`;
		const importCall = `import\\s*\\(\\s*['\"][^'\"]*(?:${pathSegment})['\"]\\s*\\)|import\\s*\\(\\s*['\"]${directSegment}['\"]\\s*\\)`;
		const regex = new RegExp(`(?:${importFrom}|${importCall})`, 'g');
		this.importPathRegexCache.set(fileBaseName, regex);
		return regex;
	}

	static findExactTagMatches (text: string, tagName: string): number[] {
		const regex = this.buildExactTagRegex(tagName);
		regex.lastIndex = 0;
		const matches: number[] = [];

		let match;
		while ((match = regex.exec(text)) !== null) {
			matches.push(match.index);
		}

		return matches;
	}

	static findImportMatchesInText (text: string, componentName: string): number[] {
		const regex = this.buildImportRegex(componentName);
		regex.lastIndex = 0;
		const matches: number[] = [];

		let match;
		while ((match = regex.exec(text)) !== null) {
			matches.push(match.index);
		}

		return matches;
	}

	private static escapeRegex (value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

}
