import { window } from 'vscode';
import { getDropdownSelection, getFilenameFromPath, loopNumber } from '../../helpers';

export async function SwitchFS9FSX() {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	if ('file' !== document.uri.scheme) {
		return;
	}

	const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
	if (!filename.startsWith('flightplans')) {
		return;
	}

	const selection = editor.selection;
	let text = document.getText(selection);

	// Get direction
	const dirStr = await getDropdownSelection('Select switch direction', ['FS9 → FSX', 'FSX → FS9']);
	if (!dirStr) {
		return false;
	}
	const toFS9 = dirStr === 'FSX → FS9';

	text = text.replace(/(\,\d\/)/gi, (fullMatch, g1: string) => {
		// In FS9 the week starts on Sunday which has the number 0. In FSX the week starts on Monday with the number 0.
		//      M T W T F S S
		// FS9: 1 2 3 4 5 6 0
		// FSX: 0 1 2 3 4 5 6
		// FS9 → FSX = -1
		// FSX → FS9 = +1
		let num = Number(g1.substr(1, 1));
		num = loopNumber(num, 0, 6, toFS9 ? 1 : -1);

		return `,${num}/`;
	});
	editor.edit((editBuilder) => {
		editBuilder.replace(selection, text);
	});
	let from = toFS9 ? 'FSX' : 'FS9';
	let to = toFS9 ? 'FS9' : 'FSX';
	window.showInformationMessage(`Selected flightplans changed from ${from} to ${to}`);
}
