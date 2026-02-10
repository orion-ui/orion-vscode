import type * as vscode from 'vscode';

export const isVueDocument = (document: vscode.TextDocument): boolean => {
	return document.languageId === 'vue' || document.fileName.endsWith('.vue');
};

export const isComponentSetupDocument = (document: vscode.TextDocument): boolean => {
	return document.languageId === 'typescript' || !!document.fileName.match(/Setup(Service)?\.ts$/);
};

export const isTypeScriptDocument = (document: vscode.TextDocument): boolean => {
	return document.languageId === 'typescript' || document.fileName.endsWith('.ts');
};

export const isJavaScriptDocument = (document: vscode.TextDocument): boolean => {
	return document.languageId === 'javascript' || document.fileName.endsWith('.js');
};

export const isScriptDocument = (document: vscode.TextDocument): boolean => {
	return isTypeScriptDocument(document) || isJavaScriptDocument(document);
};
