import * as fs from 'fs';
import { workspace, Uri, Position, window, Selection, Range } from 'vscode';
import { showErrorModal } from '../Tools/helpers';

/**
 * Opens the master airports file set at `fs-ai-tools.masterAirportsFilePath`
 * and sets the cursor to the end of the file. Shows an error if file path isn't
 * set.
 */
export function OpenMasterAirportsFile() {
	const filePath = workspace.getConfiguration('fs-ai-tools', undefined).get('masterAirportsFilePath') as string;

	if (!filePath.length) {
		showErrorModal(
			'File path not set',
			"The file path to the master airports file isn't set. Check the `fs-ai-tools.masterAirportsFilePath` setting."
		);
		return;
	}

	if (!fs.existsSync(filePath)) {
		showErrorModal('File not found', `File at path "${filePath}" doesn't exist.`);
		return;
	}

	const uri = Uri.file(filePath);
	workspace.openTextDocument(uri).then((doc) => {
		window.showTextDocument(doc).then((editor) => {
			// Jump to last line
			const pos = new Position(doc.lineCount + 1, 0);

			// Selection with same position twice → cursor jumps there
			editor.selections = [new Selection(pos, pos)];
			editor.revealRange(new Range(pos, pos));
		});
	});
}
