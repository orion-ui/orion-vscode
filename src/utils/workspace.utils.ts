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
	filter: (uri: vscode.Uri) => Promise<boolean> = () => Promise.resolve(true),
	exclude = '**/node_modules/**',
) => {
	// console.log('------------------');
	// console.log(`🚀 ~ searchGlobalAsync ~ pattern:`, pattern);
	// console.log(`🚀 ~ searchGlobalAsync ~ include:`, include);
	const candidatesFiles = await vscode.workspace.findFiles(include, exclude);
	const matchingFiles = [];
	for (const file of candidatesFiles) {
		if (await filter(file)) {
			matchingFiles.push(file);
		}
	}

	// console.log(`🚀 ~ searchGlobalAsync ~ matchingFiles:`, matchingFiles);
	const results: Utils.UsageLocation[] = [];

	for (const file of matchingFiles) {
		const document = await vscode.workspace.openTextDocument(file);
		const text = document.getText();
		const lines = text.split('\n');

		lines.forEach((line, index) => {
			if (pattern.test(line)) {
				results.push({
					uri: file,
					text: line.trim(),
					line: index,
					start: line.indexOf(line.trim()),
					end: line.indexOf(line.trim()) + line.trim().length,
				});
			}
		});
	}

	return results;
};
