import * as vscode from 'vscode';
import { fetch } from 'undici';
import bundledDocs from '../data/orion-docs.json';
import { fetchOrionDocsAsync, type OrionComponentDocs } from '../core/orionDocsService';

export class OrionDocsProvider {

	private cache = new Map<string, OrionComponentDocs>();

	async getDocsAsync (componentName: string): Promise<OrionComponentDocs | null> {
		const key = componentName.toLowerCase();
		const cached = this.cache.get(key);
		if (cached) {
			return cached;
		}

		const docsSource = vscode.workspace
			.getConfiguration('orion')
			.get<string>('docsSource', 'remote');

		let docs: OrionComponentDocs | null = null;

		if (docsSource === 'bundled') {
			docs = (bundledDocs as Record<string, OrionComponentDocs>)[key] ?? null;
		}
		else {
			const baseUrl = vscode.workspace
				.getConfiguration('orion')
				.get<string>('docsBaseUrl', 'https://orion-ui.org');
			docs = await fetchOrionDocsAsync(baseUrl, key, fetch);
		}

		if (docs) {
			this.cache.set(key, docs);
		}

		return docs;
	}

	clearCache (): void {
		this.cache.clear();
	}

}
