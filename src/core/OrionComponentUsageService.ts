import * as path from 'path';
import * as vscode from 'vscode';
import { OrionComponentUsageMatcher } from './OrionComponentUsageMatcher';

export class OrionComponentUsageService {

	static resolveComponentIdentity (document: vscode.TextDocument): ComponentIdentity | null {
		return OrionComponentUsageMatcher.resolveComponentIdentityFromFile(document.fileName);
	}

	static resolveNearestSrcRoot (document: vscode.TextDocument): string | null {
		return this.resolveNearestSrcRootPath(document);
	}

	static async findUsageLocationsAsync (
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): Promise<ComponentUsageLocation[]> {
		const identity = this.resolveComponentIdentity(document);
		if (!identity || token.isCancellationRequested) {
			return [];
		}

		const searchRoot = this.resolveNearestSrcRootPath(document);
		if (!searchRoot || token.isCancellationRequested) {
			return [];
		}

		if (identity.isShared) {
			return this.findSharedUsagesAsync(identity, searchRoot, token);
		}

		return this.findNonSharedUsagesAsync(identity, searchRoot, token);
	}

	private static async findSharedUsagesAsync (
		identity: ComponentIdentity,
		searchRoot: string,
		token: vscode.CancellationToken,
	): Promise<ComponentUsageLocation[]> {
		const tagNames = new Set<string>([identity.name, identity.kebabName]);
		const results = await this.findUsageLocationsInWorkspaceAsync(searchRoot, tagNames, token);
		const importResults = await this.findImportUsageLocationsInWorkspaceAsync(
			searchRoot,
			identity.name,
			identity.fileBaseName,
			token,
		);
		return this.dedupeLocations([...results, ...importResults]);
	}

	private static async findNonSharedUsagesAsync (
		identity: ComponentIdentity,
		searchRoot: string,
		token: vscode.CancellationToken,
	): Promise<ComponentUsageLocation[]> {
		if (token.isCancellationRequested) {
			return [];
		}

		const importNameRegex = OrionComponentUsageMatcher.buildImportRegex(identity.name);
		const importPathRegex = OrionComponentUsageMatcher.buildImportPathRegex(identity.fileBaseName);
		const candidateUris = await this.searchWorkspaceForImportsAsync(searchRoot, [importNameRegex, importPathRegex], token);
		if (token.isCancellationRequested || candidateUris.length === 0) {
			return [];
		}

		const tagNames = new Set<string>([identity.name, identity.kebabName]);

		const results: ComponentUsageLocation[] = [];
		for (const uri of candidateUris) {
			if (token.isCancellationRequested) {
				return [];
			}

			const document = await vscode.workspace.openTextDocument(uri);
			results.push(...this.findImportLocationsInDocument(document, identity.name, identity.fileBaseName));
			if (document.languageId === 'vue' || document.fileName.endsWith('.vue')) {
				results.push(...this.findUsageLocationsInDocument(document, tagNames));
			}
		}

		return this.dedupeLocations(results);
	}

	private static async findUsageLocationsInWorkspaceAsync (
		searchRoot: string,
		tagNames: Set<string>,
		token: vscode.CancellationToken,
	): Promise<ComponentUsageLocation[]> {
		const pattern = new vscode.RelativePattern(searchRoot, '**/*.vue');
		const uris = await vscode.workspace.findFiles(pattern, '**/{node_modules,dist}/**', undefined, token);
		const results: ComponentUsageLocation[] = [];

		for (const uri of uris) {
			if (token.isCancellationRequested) {
				return [];
			}

			const document = await vscode.workspace.openTextDocument(uri);
			results.push(...this.findUsageLocationsInDocument(document, tagNames));
		}

		return results;
	}

	private static async searchWorkspaceForImportsAsync (
		searchRoot: string,
		regexes: RegExp[],
		token: vscode.CancellationToken,
	): Promise<vscode.Uri[]> {
		const pattern = new vscode.RelativePattern(searchRoot, '**/*.{vue,ts,js}');
		const uris = await vscode.workspace.findFiles(pattern, '**/{node_modules,dist}/**', undefined, token);
		const matches = new Map<string, vscode.Uri>();

		for (const uri of uris) {
			if (token.isCancellationRequested) {
				return [];
			}

			const document = await vscode.workspace.openTextDocument(uri);
			const text = document.getText();
			const hasMatch = regexes.some((regex) => {
				regex.lastIndex = 0;
				return regex.test(text);
			});
			if (hasMatch) {
				matches.set(uri.toString(), uri);
			}
		}

		return Array.from(matches.values());
	}

	private static async findImportUsageLocationsInWorkspaceAsync (
		searchRoot: string,
		componentName: string,
		fileBaseName: string,
		token: vscode.CancellationToken,
	): Promise<ComponentUsageLocation[]> {
		const importNameRegex = OrionComponentUsageMatcher.buildImportRegex(componentName);
		const importPathRegex = OrionComponentUsageMatcher.buildImportPathRegex(fileBaseName);
		const pattern = new vscode.RelativePattern(searchRoot, '**/*.{vue,ts,js}');
		const uris = await vscode.workspace.findFiles(pattern, '**/{node_modules,dist}/**', undefined, token);
		const results: ComponentUsageLocation[] = [];

		for (const uri of uris) {
			if (token.isCancellationRequested) {
				return [];
			}

			const document = await vscode.workspace.openTextDocument(uri);
			results.push(...this.findImportLocationsInDocument(document, componentName, fileBaseName, importNameRegex, importPathRegex));
		}

		return results;
	}

	private static findUsageLocationsInDocument (
		document: vscode.TextDocument,
		tagNames: Set<string>,
	): ComponentUsageLocation[] {
		const results: ComponentUsageLocation[] = [];
		const text = document.getText();

		for (const tagName of tagNames) {
			const matches = OrionComponentUsageMatcher.findExactTagMatches(text, tagName);
			for (const matchIndex of matches) {
				const start = document.positionAt(matchIndex);
				const end = document.positionAt(matchIndex + tagName.length + 1);
				const lineText = document.lineAt(start.line).text.trim();
				results.push({
					uri: document.uri,
					range: new vscode.Range(start, end),
					lineText,
				});
			}
		}

		return results;
	}

	private static findImportLocationsInDocument (
		document: vscode.TextDocument,
		componentName: string,
		fileBaseName: string,
		importNameRegex = OrionComponentUsageMatcher.buildImportRegex(componentName),
		importPathRegex = OrionComponentUsageMatcher.buildImportPathRegex(fileBaseName),
	): ComponentUsageLocation[] {
		const text = document.getText();
		const results: ComponentUsageLocation[] = [];
		const matchers = [
			{ regex: importNameRegex, highlight: componentName },
			{ regex: importPathRegex, highlight: fileBaseName },
		];

		for (const matcher of matchers) {
			matcher.regex.lastIndex = 0;
			let match;
			while ((match = matcher.regex.exec(text)) !== null) {
				const matchOffset = match.index;
				const nameIndex = match[0].indexOf(matcher.highlight);
				const startOffset = nameIndex >= 0 ? matchOffset + nameIndex : matchOffset;
				const start = document.positionAt(startOffset);
				const end = document.positionAt(startOffset + matcher.highlight.length);
				const lineText = document.lineAt(start.line).text.trim();
				results.push({
					uri: document.uri,
					range: new vscode.Range(start, end),
					lineText,
				});
			}
		}

		return results;
	}

	private static dedupeLocations (locations: ComponentUsageLocation[]): ComponentUsageLocation[] {
		const deduped = new Map<string, ComponentUsageLocation>();
		for (const location of locations) {
			const key = `${location.uri.toString()}:${location.range.start.line}:${location.range.start.character}`;
			if (!deduped.has(key)) {
				deduped.set(key, location);
			}
		}

		return Array.from(deduped.values());
	}

	private static resolveNearestSrcRootPath (document: vscode.TextDocument): string | null {
		let currentDir = path.dirname(document.uri.fsPath);
		while (true) {
			if (path.basename(currentDir) === 'src') {
				return currentDir;
			}
			const parentDir = path.dirname(currentDir);
			if (parentDir === currentDir) {
				return null;
			}
			currentDir = parentDir;
		}
	}

}
