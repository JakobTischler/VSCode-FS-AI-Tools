import * as vscode from 'vscode';

/*
1. Get aifp.cfg data, logo
2. Present data:
   —————————————————————————————————
                 [LOGO]
              AIRLINE NAME
   ICAO: XXX • CALLSIGN: LOREM IPSUM
   —————————————————————————————————
3. Get flightplan from current directory (or use current file if is flightplan)
4. Parse FP to get routes
5. Use OpenStreetMap to show routes (coordinates from airports file)
 */

// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
// https://code.visualstudio.com/api/extension-guides/custom-editors

export class AirlinePresentationPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: AirlinePresentationPanel | undefined;

	public static readonly viewType = 'airlinePresentation';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	private _iteration: number = 0;

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// CREATE OR SHOW
	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		// If panel exists, show it.
		if (AirlinePresentationPanel.currentPanel) {
			AirlinePresentationPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Else, create new panel.
		const panel = vscode.window.createWebviewPanel(
			AirlinePresentationPanel.viewType,
			'Airline Presentation',
			column || vscode.ViewColumn.One,
			AirlinePresentationPanel.getWebviewOptions(extensionUri)
		);

		AirlinePresentationPanel.currentPanel = new AirlinePresentationPanel(panel, extensionUri);
	}

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// REVIVE
	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		AirlinePresentationPanel.currentPanel = new AirlinePresentationPanel(panel, extensionUri);
	}

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// CONSTRUCTOR
	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update content based on view changes
		this._panel.onDidChangeViewState(
			(e) => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// GET WEBVIEW OPTIONS
	public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
		return {
			// Enable javascript in the webview
			enableScripts: true,

			// And restrict the webview to only loading content from our extension's `media` directory.
			// localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
		};
	}

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// DISPOSE
	private dispose() {
		AirlinePresentationPanel.currentPanel = undefined;

		// Clean up resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// UPDATE CONTENT
	private _update() {
		this._iteration++;
		const webview = this._panel.webview;
		// TODO
		this._panel.title = 'Airline Presentation';
		this._panel.webview.html = this.getHtmlForWebview();
	}

	// ————————————————————————————————————————————————————————————————————————————————————————————————————
	// GENERATE HTML
	private getHtmlForWebview() {
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>My JT Title</title>
			</head>
			<body>
				<h1 id="">Airline detail view</h1>
				<p>Iteration #${this._iteration}</p>
			</body>
			</html>`;
	}
}
