import * as vscode from 'vscode';
import * as path from 'path';
import { readAifpCfg } from '../../Tools/read-aifp';
import { showErrorModal, writeTextToClipboard } from '../../Tools/helpers';

export async function GitCommitMessage() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	const dirPath = path.dirname(document.fileName).replace(/^\/+/, '');

	const aifpData = await readAifpCfg(path.join(dirPath, 'aifp.cfg'));
	if (!aifpData.found) {
		showErrorModal(
			`aifp.cfg not found`,
			`The flightplan's aifp.cfg file is required to gather the data for the commit message.`
		);
		return false;
	}

	const output = `${aifpData.airline}
${aifpData.author}, ${aifpData.season}`;

	vscode.window
		.showInformationMessage(`Git commit message for ${aifpData.airline}`, { modal: true, detail: output }, 'Copy')
		.then((buttonText) => {
			if (buttonText) {
				writeTextToClipboard(output, 'Copied to clipboard');
			}
		});
}
