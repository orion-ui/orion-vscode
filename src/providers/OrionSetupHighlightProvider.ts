import * as vscode from 'vscode';
import { OrionSetupDetector, type SetupTokenMatch } from '../core/OrionSetupDetector';

const DEFAULT_SETUP_HIGHLIGHT = 'rgb(156, 105, 252)';

const isVueDocument = (document: vscode.TextDocument): boolean =>
	document.languageId === 'vue' || document.fileName.endsWith('.vue');

const toRgba = (color: string, alpha: number): string => {
	const rgb = color.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
	if (rgb) {
		const [, r, g, b] = rgb;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const rgba = color.match(/^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([0-9.]+)\s*\)$/i);
	if (rgba) {
		const [, r, g, b] = rgba;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (hex) {
		const value = hex[1].length === 3
			? hex[1].split('').map(channel => channel + channel).join('')
			: hex[1];
		const r = parseInt(value.slice(0, 2), 16);
		const g = parseInt(value.slice(2, 4), 16);
		const b = parseInt(value.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	return color;
};

const getSetupHighlightColor = (): string =>
	vscode.workspace.getConfiguration('orion').get<string>('setupHighlightColor', DEFAULT_SETUP_HIGHLIGHT);

const createSetupDecorationType = (): vscode.TextEditorDecorationType => {
	const color = getSetupHighlightColor();
	const backgroundColor = toRgba(color, 0.1);
	return vscode.window.createTextEditorDecorationType({
		color,
		backgroundColor,
		borderRadius: '4px',
	});
};

export const registerSetupHighlighting = (context: vscode.ExtensionContext): void => {
	let decorationType = createSetupDecorationType();
	context.subscriptions.push(decorationType);

	const updateDecorations = (editor?: vscode.TextEditor): void => {
		if (!editor) {
			return;
		}
		if (!isVueDocument(editor.document)) {
			editor.setDecorations(decorationType, []);
			return;
		}

		const matches = OrionSetupDetector.detectSetupTokens(editor.document.getText());
		const ranges = matches.map((match: SetupTokenMatch) => {
			const start = editor.document.positionAt(match.offset);
			const end = editor.document.positionAt(match.offset + match.length);
			return new vscode.Range(start, end);
		});
		editor.setDecorations(decorationType, ranges);
	};

	updateDecorations(vscode.window.activeTextEditor);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor((editor) => {
			updateDecorations(editor);
		}),
		vscode.workspace.onDidChangeTextDocument((event) => {
			const active = vscode.window.activeTextEditor;
			if (active && event.document === active.document) {
				updateDecorations(active);
			}
		}),
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('orion.setupHighlightColor')) {
				decorationType.dispose();
				decorationType = createSetupDecorationType();
				context.subscriptions.push(decorationType);
				updateDecorations(vscode.window.activeTextEditor);
			}
		}),
	);
};
