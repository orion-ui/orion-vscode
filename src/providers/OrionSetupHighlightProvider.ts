import * as vscode from 'vscode';
import { OrionSetupDetector } from '../core/OrionSetupDetector';
import { isVueDocument } from '../utils/languageUtils';
import { toRgba } from '../utils/stringUtils';

export class SetupHighlightProvider {

	private readonly DEFAULT_SETUP_HIGHLIGHT = 'rgb(156, 105, 252)';
	private decorationType: vscode.TextEditorDecorationType;

	constructor (private context: vscode.ExtensionContext) {
		this.decorationType = this.createSetupDecorationType();
		this.registerSetupHighlighting();
	}

	private registerSetupHighlighting () {
		this.context.subscriptions.push(this.decorationType);

		this.updateDecorations(vscode.window.activeTextEditor);

		this.context.subscriptions.push(
			vscode.window.onDidChangeActiveTextEditor((editor) => {
				this.updateDecorations(editor);
			}),
			vscode.workspace.onDidChangeTextDocument((event) => {
				const active = vscode.window.activeTextEditor;
				if (active && event.document === active.document) {
					this.updateDecorations(active);
				}
			}),
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (event.affectsConfiguration('orion.setupHighlightColor')) {
					this.decorationType.dispose();
					this.decorationType = this.createSetupDecorationType();
					this.context.subscriptions.push(this.decorationType);
					this.updateDecorations(vscode.window.activeTextEditor);
				}
			}),
		);
	}

	private getSetupHighlightColor () {
		return vscode.workspace.getConfiguration('orion').get<string>('setupHighlightColor', this.DEFAULT_SETUP_HIGHLIGHT);
	}

	private createSetupDecorationType () {
		const color = this.getSetupHighlightColor();
		const backgroundColor = toRgba(color, 0.1);
		return vscode.window.createTextEditorDecorationType({
			color,
			backgroundColor,
			borderRadius: '4px',
		});
	}

	private updateDecorations (editor?: vscode.TextEditor) {
		if (!editor) return;

		if (!isVueDocument(editor.document)) {
			editor.setDecorations(this.decorationType, []);
			return;
		}

		const matches = OrionSetupDetector.detectSetupTokens(editor.document.getText());
		const ranges = matches.map((match: SetupDetector.Match) => {
			const start = editor.document.positionAt(match.offset);
			const end = editor.document.positionAt(match.offset + match.length);
			return new vscode.Range(start, end);
		});
		editor.setDecorations(this.decorationType, ranges);
	};

}
