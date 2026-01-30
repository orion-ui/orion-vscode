import { parse as parseSfc } from '@vue/compiler-sfc';
import { baseParse, NodeTypes } from '@vue/compiler-dom';
import { toKebabCase } from '../utils/stringUtils';

export interface OrionDetectionResult {
	components: string[]
}

export interface NodeMatch {
	node: any
	parent?: any
}

export class OrionComponentDetector {

	private static isOffsetWithin (node: any, offset: number): boolean {
		if (!node?.loc) {
			return false;
		}

		const start = node.loc.start?.offset ?? 0;
		const end = node.loc.end?.offset ?? 0;
		return offset >= start && offset <= end;
	}

	static findNodeAtOffset (node: any, offset: number, parent?: any): NodeMatch | null {
		if (!node || !this.isOffsetWithin(node, offset)) {
			return null;
		}

		const elementParent = node.type === NodeTypes.ELEMENT ? node : parent;

		if (node.type === NodeTypes.ELEMENT) {
			if (Array.isArray(node.props)) {
				for (const prop of node.props) {
					if (this.isOffsetWithin(prop, offset)) {
						return { node: prop, parent: node };
					}
				}
			}
		}

		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				const match = this.findNodeAtOffset(child, offset, elementParent);
				if (match) {
					return match;
				}
			}
		}

		if (Array.isArray(node.branches)) {
			for (const branch of node.branches) {
				if (Array.isArray(branch.children)) {
					for (const child of branch.children) {
						const match = this.findNodeAtOffset(child, offset, elementParent);
						if (match) {
							return match;
						}
					}
				}
			}
		}

		return { node, parent };
	}

	private static collectTags (template: string): string[] {
		const ast = baseParse(template);
		const tags = new Set<string>();

		const walk = (node: any) => {
			if (!node) {
				return;
			}
			if (node.type === NodeTypes.ELEMENT && typeof node.tag === 'string') {
				tags.add(node.tag);
			}
			if (Array.isArray(node.children)) {
				node.children.forEach(walk);
			}
			if (Array.isArray(node.branches)) {
				node.branches.forEach((branch: any) => {
					if (Array.isArray(branch.children)) {
						branch.children.forEach(walk);
					}
				});
			}
		};

		walk(ast);
		return [...tags];
	}

	static detectOrionComponents (sfcContent: string, canonicalList: Set<string>): OrionDetectionResult {
		try {
			const { descriptor } = parseSfc(sfcContent);
			const templateContent = descriptor.template?.content;

			if (!templateContent) {
				return { components: [] };
			}

			const tags = this.collectTags(templateContent);
			const matches = tags
				.map(tag => toKebabCase(tag))
				.filter(tag => canonicalList.has(tag));

			return { components: [...new Set(matches)].sort() };
		}
		catch {
			return { components: [] };
		}
	}

}
