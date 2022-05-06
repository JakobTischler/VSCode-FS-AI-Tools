import * as vscode from 'vscode';
import '../../Extenders/number';

export async function RenumberSceneryCfg() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if ('file' === document.uri.scheme && document.uri.path.toLocaleLowerCase().endsWith('scenery.cfg')) {
			let text = document.getText();
			const splitText = text.split('\n');
			// const textLineLength = splitText.length;
			const cleanTextArray: string[] = [];

			let entryIndex = 1;

			for (let line of splitText) {
				line = line.trim();

				if (line.length > 0) {
					if (line.toLowerCase().startsWith('[area.')) {
						line = `[Area.${entryIndex.pad(3)}]`;
					} else if (line.toLowerCase().startsWith('layer=')) {
						line = `Layer=${entryIndex}`;
						entryIndex++;
					}
				}

				cleanTextArray.push(line);
			}

			text = cleanTextArray.join('\n');

			// Apply changes to document
			editor.edit((editBuilder) => {
				editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 500), text);
			});
			vscode.window.showInformationMessage('add-ons.cfg renumbered');
		}
	}
}
