import * as path from 'path';
import * as vscode from 'vscode';
import { normalizeServiceName } from '../utils/serviceNameUtils';
import { toKebabCase } from '../utils/stringUtils';

type ServiceTemplateSource = 'built-in' | 'workspace';

type ServiceTemplate = {
	name: string
	description?: string
	content: string
	fileName: string
	source: ServiceTemplateSource
};

type ServiceTemplatePickItem = vscode.QuickPickItem & {
	template: ServiceTemplate
};

export class ServiceTemplateService {

	static async createServiceFromTemplateAsync (extensionUri: vscode.Uri, targetUri?: vscode.Uri): Promise<void> {
		const targetFolder = await this.resolveTargetFolderAsync(targetUri);
		if (!targetFolder) {
			return;
		}

		const serviceInput = await this.promptForServiceNameAsync();
		if (!serviceInput) {
			return;
		}

		const srcFolder = await this.resolveSrcFolderAsync(targetFolder);
		if (!srcFolder) {
			return;
		}

		const templates = await this.loadTemplatesAsync(extensionUri, srcFolder);
		if (!templates.length) {
			vscode.window.showErrorMessage('No service templates were found.');
			return;
		}

		const template = await this.pickTemplateAsync(templates);
		if (!template) {
			return;
		}

		await this.createServiceFileAsync(template, serviceInput, targetFolder);
	}

	private static async promptForServiceNameAsync (): Promise<NormalizedServiceName | null> {
		const basePrompt = 'Enter the service name';
		const inputBox = vscode.window.createInputBox();
		inputBox.prompt = basePrompt;
		inputBox.placeholder = 'my awesome service';
		inputBox.ignoreFocusOut = true;

		return new Promise<NormalizedServiceName | null>((resolve) => {
			const updatePrompt = (value: string): void => {
				const normalized = normalizeServiceName(value);
				if (!normalized) {
					inputBox.validationMessage = value.trim().length > 0
						? 'Enter a name containing letters or numbers.'
						: undefined;
					inputBox.prompt = basePrompt;
					return;
				}

				inputBox.validationMessage = undefined;
				inputBox.prompt = `${basePrompt} (ServiceName: ${normalized.pascalName} · serviceName: ${normalized.camelName})`;
			};

			updatePrompt(inputBox.value);

			const onChange = inputBox.onDidChangeValue(updatePrompt);
			const onAccept = inputBox.onDidAccept(() => {
				const normalized = normalizeServiceName(inputBox.value);
				if (!normalized) {
					inputBox.validationMessage = 'Enter a name containing letters or numbers.';
					return;
				}
				resolve(normalized);
				inputBox.hide();
			});
			const onHide = inputBox.onDidHide(() => {
				resolve(null);
				inputBox.dispose();
			});

			inputBox.show();

			const disposeAll = (): void => {
				onChange.dispose();
				onAccept.dispose();
				onHide.dispose();
			};

			inputBox.onDidHide(() => {
				disposeAll();
			});
		});
	}

	private static async resolveTargetFolderAsync (targetUri?: vscode.Uri): Promise<vscode.Uri | null> {
		if (targetUri) {
			const stat = await vscode.workspace.fs.stat(targetUri);
			if (stat.type & vscode.FileType.Directory) {
				return targetUri;
			}
			return vscode.Uri.file(path.dirname(targetUri.fsPath));
		}

		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			vscode.window.showErrorMessage('Open a file to select a target service folder.');
			return null;
		}

		let servicesRoot = await this.findNearestServicesRootAsync(activeEditor.document.uri.fsPath);
		if (!servicesRoot) {
			const srcFolder = await this.pickWorkspaceSrcFolderAsync();
			if (!srcFolder) {
				return null;
			}
			const candidate = vscode.Uri.joinPath(srcFolder, 'services');
			const isDirectory = await this.isDirectoryAsync(candidate);
			if (!isDirectory) {
				vscode.window.showErrorMessage('No src/services folder exists under the selected src folder.');
				return null;
			}
			servicesRoot = candidate;
		}

		return this.pickServicesTargetFolderAsync(servicesRoot);
	}

	private static async resolveSrcFolderAsync (targetFolder: vscode.Uri): Promise<vscode.Uri | null> {
		let currentPath = targetFolder.fsPath;
		let lastPath: string | null = null;

		while (currentPath && currentPath !== lastPath) {
			if (path.basename(currentPath) === 'src') {
				return vscode.Uri.file(currentPath);
			}
			lastPath = currentPath;
			currentPath = path.dirname(currentPath);
		}

		const srcFolders = await this.findWorkspaceSrcFoldersAsync();
		if (!srcFolders.length) {
			vscode.window.showErrorMessage('No src folders were found in the workspace.');
			return null;
		}

		if (srcFolders.length === 1) {
			return srcFolders[0];
		}

		const picked = await this.pickWorkspaceSrcFolderAsync(srcFolders);
		return picked ?? null;
	}

	private static async pickWorkspaceSrcFolderAsync (folders?: vscode.Uri[]): Promise<vscode.Uri | null> {
		const srcFolders = folders ?? await this.findWorkspaceSrcFoldersAsync();
		if (!srcFolders.length) {
			vscode.window.showErrorMessage('No src folders were found in the workspace.');
			return null;
		}

		if (srcFolders.length === 1) {
			return srcFolders[0];
		}

		const items = srcFolders.map((folder) => {
			const shortPath = this.formatPathTail(folder.fsPath, 3);
			return {
				label: shortPath,
				detail: vscode.workspace.asRelativePath(folder),
				folder,
			};
		});

		const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a src folder' });

		return picked?.folder ?? null;
	}

	private static async findNearestServicesRootAsync (filePath: string): Promise<vscode.Uri | null> {
		const servicesRoots = await this.findWorkspaceServicesRootsAsync();
		if (!servicesRoots.length) {
			return null;
		}

		if (servicesRoots.length === 1) {
			return servicesRoots[0];
		}

		let bestScore = -1;
		let bestMatches: vscode.Uri[] = [];
		for (const root of servicesRoots) {
			const score = this.sharedPathDepth(filePath, root.fsPath);
			if (score > bestScore) {
				bestScore = score;
				bestMatches = [root];
			}
			else if (score === bestScore) {
				bestMatches.push(root);
			}
		}

		if (bestMatches.length === 1) {
			return bestMatches[0];
		}

		return this.pickServicesRootAsync(bestMatches);
	}

	private static async pickServicesTargetFolderAsync (servicesRoot: vscode.Uri): Promise<vscode.Uri | null> {
		const folders = await this.collectDirectoriesAsync(servicesRoot);
		const folderItems = folders.map((folder) => {
			const relative = path.relative(servicesRoot.fsPath, folder.fsPath);
			const label = relative ? `services/${relative.replace(/\\/g, '/')}` : 'services';
			return {
				label,
				detail: vscode.workspace.asRelativePath(folder),
				folder,
			};
		});

		const selected = await vscode.window.showQuickPick(folderItems, {
			placeHolder: 'Select the service folder',
			ignoreFocusOut: true,
		});

		if (!selected) {
			return null;
		}

		const actionItems = [
			{
				label: 'Create in selected folder',
				detail: selected.label,
				value: 'existing' as const,
			},
			{
				label: 'Create new sub-folder',
				detail: `Under ${selected.label}`,
				value: 'new' as const,
			},
		];

		const action = await vscode.window.showQuickPick(actionItems, {
			placeHolder: 'Create service in…',
			ignoreFocusOut: true,
		});

		if (!action) {
			return null;
		}

		if (action.value === 'existing') {
			return selected.folder;
		}

		const newFolderName = await this.promptForNewFolderNameAsync();
		if (!newFolderName) {
			return null;
		}
		const newFolder = vscode.Uri.joinPath(selected.folder, newFolderName);
		await vscode.workspace.fs.createDirectory(newFolder);
		return newFolder;
	}

	private static async promptForNewFolderNameAsync (): Promise<string | null> {
		const input = await vscode.window.showInputBox({
			prompt: 'New folder name',
			placeHolder: 'my-new-service',
			ignoreFocusOut: true,
			validateInput: (value: string): string | null => {
				const normalized = toKebabCase(value).trim();
				return normalized.length > 0
					? null
					: 'Enter a folder name.';
			},
		});

		if (!input) {
			return null;
		}

		const normalized = toKebabCase(input).trim();
		return normalized.length > 0 ? normalized : null;
	}

	private static async pickServicesRootAsync (servicesRoots: vscode.Uri[]): Promise<vscode.Uri | null> {
		const items = servicesRoots.map(root => ({
			label: this.formatPathTail(root.fsPath, 3),
			detail: vscode.workspace.asRelativePath(root),
			root,
		}));

		const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a src/services folder' });

		return picked?.root ?? null;
	}

	private static async collectDirectoriesAsync (root: vscode.Uri): Promise<vscode.Uri[]> {
		const result: vscode.Uri[] = [root];
		let entries: [string, vscode.FileType][] = [];

		try {
			entries = await vscode.workspace.fs.readDirectory(root);
		}
		catch {
			return result;
		}

		for (const [name, type] of entries) {
			if (!(type & vscode.FileType.Directory)) {
				continue;
			}
			const child = vscode.Uri.joinPath(root, name);
			result.push(child);
			const nested = await this.collectDirectoriesAsync(child);
			result.push(...nested.slice(1));
		}

		return result;
	}

	private static async isDirectoryAsync (uri: vscode.Uri): Promise<boolean> {
		try {
			const stat = await vscode.workspace.fs.stat(uri);
			return Boolean(stat.type & vscode.FileType.Directory);
		}
		catch {
			return false;
		}
	}

	private static formatPathTail (filePath: string, segments: number): string {
		const parts = filePath.split(path.sep).filter(Boolean);
		return parts.slice(-segments).join(path.sep);
	}

	private static async findWorkspaceSrcFoldersAsync (): Promise<vscode.Uri[]> {
		const results = await vscode.workspace.findFiles('**/src/**', '**/node_modules/**');
		const folders = new Map<string, vscode.Uri>();

		for (const uri of results) {
			const srcPath = this.extractSrcFolderFromPath(uri.fsPath);
			if (srcPath) {
				folders.set(srcPath, vscode.Uri.file(srcPath));
			}
		}

		return Array.from(folders.values());
	}

	private static async findWorkspaceServicesRootsAsync (): Promise<vscode.Uri[]> {
		const results = await vscode.workspace.findFiles('**/src/services/**', '**/node_modules/**');
		const folders = new Map<string, vscode.Uri>();

		for (const uri of results) {
			const servicesRoot = this.extractServicesRootFromPath(uri.fsPath);
			if (servicesRoot) {
				folders.set(servicesRoot, vscode.Uri.file(servicesRoot));
			}
		}

		return Array.from(folders.values());
	}

	private static extractSrcFolderFromPath (filePath: string): string | null {
		const { root, dir } = path.parse(filePath);
		const parts = path
			.normalize(dir)
			.slice(root.length)
			.split(path.sep)
			.filter(Boolean);

		const index = parts.lastIndexOf('src');
		if (index === -1) {
			return null;
		}

		return path.join(root, ...parts.slice(0, index + 1));
	}

	private static extractServicesRootFromPath (filePath: string): string | null {
		const { root, dir } = path.parse(filePath);
		const parts = path
			.normalize(dir)
			.slice(root.length)
			.split(path.sep)
			.filter(Boolean);

		const srcIndex = parts.lastIndexOf('src');
		if (srcIndex === -1 || parts[srcIndex + 1] !== 'services') {
			return null;
		}

		return path.join(root, ...parts.slice(0, srcIndex + 2));
	}

	private static sharedPathDepth (leftPath: string, rightPath: string): number {
		const leftParts = path.normalize(leftPath).split(path.sep).filter(Boolean);
		const rightParts = path.normalize(rightPath).split(path.sep).filter(Boolean);
		const length = Math.min(leftParts.length, rightParts.length);
		let depth = 0;
		for (let i = 0; i < length; i += 1) {
			if (leftParts[i] !== rightParts[i]) {
				break;
			}
			depth += 1;
		}
		return depth;
	}

	private static async loadTemplatesAsync (extensionUri: vscode.Uri, srcFolder: vscode.Uri): Promise<ServiceTemplate[]> {
		const builtInTemplates = await this.loadBuiltInTemplatesAsync(extensionUri);
		const workspaceTemplates = await this.loadWorkspaceTemplatesAsync(srcFolder);

		return [...builtInTemplates, ...workspaceTemplates];
	}

	private static async loadBuiltInTemplatesAsync (extensionUri: vscode.Uri): Promise<ServiceTemplate[]> {
		const templatesUri = vscode.Uri.joinPath(extensionUri, 'resources', 'templates', 'service');
		return this.loadTemplatesFromFolderAsync(templatesUri, 'built-in');
	}

	private static async loadWorkspaceTemplatesAsync (srcFolder: vscode.Uri): Promise<ServiceTemplate[]> {
		const parentDir = path.dirname(srcFolder.fsPath);
		const templatesPath = path.join(parentDir, '.orion', 'templates', 'services');
		const templatesUri = vscode.Uri.file(templatesPath);

		try {
			const stat = await vscode.workspace.fs.stat(templatesUri);
			if (!(stat.type & vscode.FileType.Directory)) {
				return [];
			}
		}
		catch {
			return [];
		}

		return this.loadTemplatesFromFolderAsync(templatesUri, 'workspace');
	}

	private static async loadTemplatesFromFolderAsync (folderUri: vscode.Uri, source: ServiceTemplateSource): Promise<ServiceTemplate[]> {
		const templateFiles = await this.collectTemplateFilesAsync(folderUri);
		if (!templateFiles.length) {
			return [];
		}

		const templates: ServiceTemplate[] = [];
		const decoder = new TextDecoder('utf-8');

		for (const file of templateFiles) {
			const content = decoder.decode(await vscode.workspace.fs.readFile(file.uri));
			const { templateName, templateDescription } = this.extractTemplateMetadata(content, file.name);

			templates.push({
				name: templateName,
				description: templateDescription,
				content,
				fileName: file.name,
				source,
			});
		}

		return templates;
	}

	private static async collectTemplateFilesAsync (root: vscode.Uri): Promise<{ uri: vscode.Uri, name: string }[]> {
		const results: { uri: vscode.Uri, name: string }[] = [];
		let entries: [string, vscode.FileType][] = [];

		try {
			entries = await vscode.workspace.fs.readDirectory(root);
		}
		catch {
			return results;
		}

		for (const [name, type] of entries) {
			const uri = vscode.Uri.joinPath(root, name);
			if (type & vscode.FileType.Directory) {
				const nested = await this.collectTemplateFilesAsync(uri);
				results.push(...nested);
				continue;
			}
			if (type & vscode.FileType.File) {
				results.push({ uri, name });
			}
		}

		return results;
	}

	private static extractTemplateMetadata (content: string, fallbackName: string): { templateName: string, templateDescription?: string } {
		const nameMatch = content.match(/@orion\/template-name\s+(.+)/);
		const descMatch = content.match(/@orion\/template-desc\s+(.+)/);

		return {
			templateName: nameMatch?.[1]?.trim() || fallbackName,
			templateDescription: descMatch?.[1]?.trim(),
		};
	}

	private static async pickTemplateAsync (templates: ServiceTemplate[]): Promise<ServiceTemplate | null> {
		const items: ServiceTemplatePickItem[] = templates.map(template => ({
			label: template.name,
			description: template.description,
			detail: template.source === 'built-in'
				? 'Built-in template'
				: 'Workspace template',
			template,
		}));

		const picked = await vscode.window.showQuickPick(items, { placeHolder: 'Select a service template' });

		return picked?.template ?? null;
	}

	private static async createServiceFileAsync (
		template: ServiceTemplate,
		nameInfo: NormalizedServiceName,
		targetFolder: vscode.Uri,
	): Promise<void> {
		const replacements = new Map<string, string>([
			['__ServiceName__', nameInfo.pascalName],
			['__serviceName__', nameInfo.camelName],
		]);

		let fileName = this.applyTemplateReplacements(template.fileName, replacements);
		fileName = fileName.replace(/ServiceService/g, 'Service');

		const fileUri = vscode.Uri.joinPath(targetFolder, fileName);
		const exists = await this.fileExistsAsync(fileUri);
		if (exists) {
			vscode.window.showErrorMessage(`A service file already exists at ${fileName}.`);
			return;
		}

		let content = this.applyTemplateReplacements(template.content, replacements);
		content = this.stripTemplateMetadata(content);
		content = this.ensurePascalCaseClassName(content, nameInfo);

		const remaining = this.findRemainingPlaceholders(content, replacements);
		if (remaining.length && template.source === 'workspace') {
			const updated = await this.fillRemainingPlaceholdersAsync(content, remaining);
			if (!updated) {
				return;
			}
			content = updated;
		}
		else if (remaining.length) {
			vscode.window.showWarningMessage(
				`Template placeholders were not replaced: ${remaining.join(', ')}`,
			);
		}

		await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(content));

		const document = await vscode.workspace.openTextDocument(fileUri);
		await vscode.window.showTextDocument(document, { preview: false });
		vscode.window.showInformationMessage(`Service created: ${fileName}`);
	}

	private static applyTemplateReplacements (value: string, replacements: Map<string, string>): string {
		let result = value;
		for (const [token, replacement] of replacements) {
			result = result.split(token).join(replacement);
		}
		return result;
	}

	private static stripTemplateMetadata (value: string): string {
		const metadataRegex = /\s*\/\*\*[\s\S]*?@orion\/template-(?:name|desc)[\s\S]*?\*\/\s*/g;
		return value.replace(metadataRegex, '');
	}

	private static ensurePascalCaseClassName (value: string, nameInfo: NormalizedServiceName): string {
		const classRegex = new RegExp(`\\bclass\\s+${nameInfo.camelName}\\b`, 'g');
		return value.replace(classRegex, `class ${nameInfo.pascalName}`);
	}

	private static findRemainingPlaceholders (value: string, replacements: Map<string, string>): string[] {
		const matches = value.match(/__[A-Za-z][A-Za-z0-9]*__/g) ?? [];
		const remaining = matches.filter(match => !replacements.has(match));
		return Array.from(new Set(remaining));
	}

	private static async fillRemainingPlaceholdersAsync (value: string, placeholders: string[]): Promise<string | null> {
		let updated = value;
		for (const placeholder of placeholders) {
			const label = placeholder.replace(/^__|__$/g, '');
			const input = await vscode.window.showInputBox({
				prompt: `Value for ${label}`,
				placeHolder: label,
				ignoreFocusOut: true,
			});
			if (input === undefined) {
				return null;
			}
			updated = updated.split(placeholder).join(input);
		}
		return updated;
	}

	private static async fileExistsAsync (uri: vscode.Uri): Promise<boolean> {
		try {
			await vscode.workspace.fs.stat(uri);
			return true;
		}
		catch {
			return false;
		}
	}

}
