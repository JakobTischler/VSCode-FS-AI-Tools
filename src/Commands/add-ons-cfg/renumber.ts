import * as vscode from 'vscode';
import { replaceDocumentContents } from '../../Tools/helpers';

export async function RenumberAddOnsCfg() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if ('file' === document.uri.scheme && document.uri.path.toLocaleLowerCase().endsWith('add-ons.cfg')) {
			let text = document.getText();
			const splitText = text.split('\n');
			const cleanTextArray: string[] = [];

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
			replaceDocumentContents(editor, text);

			vscode.window.showInformationMessage('add-ons.cfg renumbered');
		}
	}
}
