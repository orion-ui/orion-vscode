import * as vscode from 'vscode';
import { baseParse, NodeTypes, type RootNode } from '@vue/compiler-dom';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { findNodeAtOffset } from '../core/orionComponentDetector';
import { toKebabCase } from '../utils/stringUtils';
import { findSetupTokenAtOffset } from '../core/orionSetupDetector';
import { getCanonicalComponents } from '../core/orionComponentRegistry';
import type { OrionComponentDocs, OrionPropDoc } from '../core/orionDocsService';
import { buildSetupHoverMarkdown } from '../core/orionSetupDocs';
import type { OrionDocsProvider } from './OrionDocsProvider';

type ParsedTemplate = {
	ast: RootNode
	templateOffset: number
	templateEndOffset: number
};

type CacheEntry = {
	version: number
	parsed: ParsedTemplate | null
};

export class OrionHoverProvider implements vscode.HoverProvider {

	private readonly cache = new Map<string, CacheEntry>();

	constructor (private readonly docsProvider: OrionDocsProvider) {}

	provideHover (document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null> {
		return this.provideHoverAsync(document, position, token);
	}

	private async provideHoverAsync (document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null> {
		if (token.isCancellationRequested) {
			return null;
		}

		const setupHover = await this.provideSetupHoverAsync(document, position);
		if (setupHover) {
			return setupHover;
		}
		const parsed = this.getParsedTemplate(document);
		if (!parsed) {
			return null;
		}

		const absoluteOffset = document.offsetAt(position);
		if (absoluteOffset < parsed.templateOffset || absoluteOffset > parsed.templateEndOffset) {
			return null;
		}

		const templateOffset = absoluteOffset - parsed.templateOffset;
		const match = findNodeAtOffset(parsed.ast, templateOffset);
		if (!match) {
			return null;
		}

		const element = match.node?.type === NodeTypes.ELEMENT
			? match.node
			: match.parent;
		if (!element || element.type !== NodeTypes.ELEMENT || typeof element.tag !== 'string') {
			return null;
		}

		const componentName = toKebabCase(element.tag);
		const canonical = getCanonicalComponents();
		if (!canonical.has(componentName)) {
			return null;
		}

		const docs = await this.docsProvider.getDocsAsync(componentName);
		const propName = this.getPropName(match.node);
		const markdown = propName
			? this.buildPropMarkdown(componentName, docs, propName)
			: this.buildComponentMarkdown(componentName, docs);

		markdown.appendMarkdown(`\n\n${this.buildViewDocsLink(componentName)}`);
		markdown.isTrusted = true;

		return new vscode.Hover(markdown);
	}

	private async provideSetupHoverAsync (document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
		const offset = document.offsetAt(position);
		const match = findSetupTokenAtOffset(document.getText(), offset);
		if (!match) {
			return null;
		}

		const docs = this.docsProvider.getSetupDocsForDocument(document);
		if (!docs) {
			return null;
		}

		const markdown = new vscode.MarkdownString(buildSetupHoverMarkdown(docs), true);
		return new vscode.Hover(markdown);
	}

	private getParsedTemplate (document: vscode.TextDocument): ParsedTemplate | null {
		const key = document.uri.toString();
		const cached = this.cache.get(key);
		if (cached && cached.version === document.version) {
			return cached.parsed;
		}

		const { descriptor } = parseSfc(document.getText());
		const template = descriptor.template;
		const parsed = template?.content && template.loc
			? {
				ast: baseParse(template.content),
				templateOffset: template.loc.start.offset,
				templateEndOffset: template.loc.end.offset,
			}
			: null;

		this.cache.set(key, { version: document.version, parsed });
		return parsed;
	}

	private getPropName (node: any): string | null {
		if (!node) {
			return null;
		}

		if (node.type === NodeTypes.ATTRIBUTE && typeof node.name === 'string') {
			return node.name;
		}

		if (node.type === NodeTypes.DIRECTIVE && node.name === 'bind') {
			const arg = node.arg;
			if (arg && typeof arg.content === 'string') {
				return arg.content;
			}
		}

		return null;
	}

	private buildComponentMarkdown (componentName: string, docs: OrionComponentDocs | null): vscode.MarkdownString {
		const markdown = new vscode.MarkdownString('', true);
		const title = docs?.name ?? componentName;
		markdown.appendMarkdown(`**${title}**`);

		if (!docs) {
			markdown.appendMarkdown('\n\nDocumentation unavailable.');
			return markdown;
		}

		const propsCount = docs.props?.length ?? 0;
		if (propsCount === 0) {
			markdown.appendMarkdown('\n\nNo props documented.');
			return markdown;
		}

		markdown.appendMarkdown(`\n\nProps documented: ${propsCount}.`);
		return markdown;
	}

	private buildPropMarkdown (componentName: string, docs: OrionComponentDocs | null, propName: string): vscode.MarkdownString {
		const markdown = new vscode.MarkdownString('', true);
		markdown.appendMarkdown(`**${propName}**`);
		const componentLabel = docs?.name ?? componentName;
		markdown.appendMarkdown(`\n\nComponent: ${componentLabel}`);

		const prop = docs?.props?.find(item => item.name === propName) ?? null;
		if (!prop) {
			markdown.appendMarkdown('\n\nNo documentation available for this prop.');
			return markdown;
		}

		if (prop.type) {
			markdown.appendMarkdown(`\n\nType: \`${prop.type}\``);
		}

		const description = this.getPropDescription(prop);
		markdown.appendMarkdown(`\n\n${description}`);
		return markdown;
	}

	private getPropDescription (prop: OrionPropDoc): string {
		const description = prop.description?.trim();
		return description && description.length > 0
			? description
			: 'No description available.';
	}

	private buildViewDocsLink (componentName: string): string {
		const args = encodeURIComponent(JSON.stringify([componentName]));
		return `[View in Sidebar](command:orion.showComponentDocs?${args})`;
	}

}
