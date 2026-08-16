import * as vscode from 'vscode';
import { replaceDocumentContents } from '../../Tools/helpers';
import { renumberSceneryCfg } from '../../Utils/cfg-transformations';

export async function RenumberSceneryCfg() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if ('file' === document.uri.scheme && document.uri.path.toLocaleLowerCase().endsWith('scenery.cfg')) {
			// Apply changes to document
			replaceDocumentContents(editor, renumberSceneryCfg(document.getText()));

			vscode.window.showInformationMessage('add-ons.cfg renumbered');
		}
	}
}
