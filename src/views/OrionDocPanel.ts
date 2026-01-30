import * as vscode from 'vscode';
import type { OrionComponentDocs } from '../core/orionDocsService';

export class OrionDocPanel {

	private static currentPanel: OrionDocPanel | undefined;

	private readonly panel: vscode.WebviewPanel;

	private constructor (panel: vscode.WebviewPanel) {
		this.panel = panel;
		this.panel.onDidDispose(() => {
			OrionDocPanel.currentPanel = undefined;
		});
	}

	static show (componentName: string, docs: OrionComponentDocs | null, errorMessage?: string): void {
		if (OrionDocPanel.currentPanel) {
			OrionDocPanel.currentPanel.render(componentName, docs, errorMessage);
			OrionDocPanel.currentPanel.panel.reveal();
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'orionComponentDocs',
			'Orion Component Docs',
			vscode.ViewColumn.Beside,
			{ enableScripts: false },
		);

		OrionDocPanel.currentPanel = new OrionDocPanel(panel);
		OrionDocPanel.currentPanel.render(componentName, docs, errorMessage);
	}

	private render (componentName: string, docs: OrionComponentDocs | null, errorMessage?: string): void {
		this.panel.title = `Orion Docs: ${componentName}`;

		const content = docs
			? this.renderDocs(docs)
			: this.renderEmpty(componentName, errorMessage);

		this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: sans-serif; padding: 16px; }
  h1 { font-size: 18px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
  .empty { color: #999; }
</style>
</head>
<body>
${content}
</body>
</html>`;
	}

	private renderDocs (docs: OrionComponentDocs): string {
		if (!docs.props || docs.props.length === 0) {
			return `<h1>${docs.name}</h1><p class="empty">No props documented.</p>`;
		}

		const rows = docs.props
			.map(
				(prop: { name: string, type?: string, description?: string }) =>
					`<tr><td><strong>${prop.name}</strong></td><td>${prop.type ?? ''}</td><td>${prop.description ?? ''}</td></tr>`,
			)
			.join('');

		return `<h1>${docs.name}</h1>
<table>
<thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
	}

	private renderEmpty (componentName: string, errorMessage?: string): string {
		const message = errorMessage
			? `<p class="empty">${errorMessage}</p>`
			: `<p class="empty">Documentation unavailable.</p>`;

		return `<h1>${componentName}</h1>${message}`;
	}

}
