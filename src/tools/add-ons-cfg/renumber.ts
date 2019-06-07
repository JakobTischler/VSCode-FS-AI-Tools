import * as vscode from 'vscode';

export async function RenumberAddOnsCfg() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if (
			'file' === document.uri.scheme &&
			document.uri.path.toLocaleLowerCase().endsWith('add-ons.cfg')
		) {
			let text = document.getText();
			const splitText = text.split('\n');
			const textLineLength = splitText.length;
			let cleanTextArray: string[] = [];

			let packageIndex = 0;

			for (let line of splitText) {
				line = line.trim();

				if (line.length > 0) {
					if (line.toLowerCase().startsWith('[package.')) {
						line = `[Package.${packageIndex}]`;
						packageIndex++;
					}
				}

				cleanTextArray.push(line);
			}

			text = cleanTextArray.join('\n');

			// Apply changes to document
			editor.edit(editBuilder => {
				editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 500), text);
			});
			vscode.window.showInformationMessage('add-ons.cfg renumbered');
		}
	}
}
