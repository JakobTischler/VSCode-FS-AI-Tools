import * as vscode from 'vscode';
import { replaceDocumentContents } from '../../Tools/helpers';
import { renumberAddOnsCfg } from '../../Services/cfg-transformations';

export async function RenumberAddOnsCfg() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if ('file' === document.uri.scheme && document.uri.path.toLocaleLowerCase().endsWith('add-ons.cfg')) {
			// Apply changes to document
			await replaceDocumentContents(editor, renumberAddOnsCfg(document.getText()));

			vscode.window.showInformationMessage('add-ons.cfg renumbered');
		}
	}
}
