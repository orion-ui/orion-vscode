import * as vscode from 'vscode';

export const getParentSrcUri = (uri: vscode.Uri) => {
	const segments = uri.path.split('/');
	const srcIndex = segments.lastIndexOf('src');
	if (srcIndex === -1) return null;
	const parentPath = segments.slice(0, srcIndex + 1).join('/');
	return vscode.Uri.file(parentPath);
};

export const searchGlobalAsync = async (
	pattern: RegExp,
	include: vscode.RelativePattern,
	exclude = '**/node_modules/**',
	ignoreUri?: vscode.Uri,
) => {
	const results: Utils.UsageLocation[] = [];
	const files = await vscode.workspace.findFiles(include, exclude);
	const decoder = new TextDecoder('utf-8');
	const linePattern = new RegExp(pattern.source, pattern.flags.replace('g', ''));

	for (const file of files) {
		if (ignoreUri && file.fsPath === ignoreUri.fsPath) continue;

		const data = await vscode.workspace.fs.readFile(file);
		const text = decoder.decode(data);
		const lines = text.split('\n');

		lines.forEach((line, index) => {
			const match = linePattern.exec(line);
			if (!match) return;

			const start = match.index;
			results.push({
				uri: file,
				text: line.trim(),
				line: index,
				start,
				end: start + match[0].length,
			});
		});
	}

	return results;
};
