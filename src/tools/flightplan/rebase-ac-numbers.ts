import { window } from 'vscode';
import { getFilenameFromPath } from '../../helpers';

export async function RebaseAircraftNumbers() {
	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && (filename.startsWith('aircraft') || filename.startsWith('flightplans'))) {
			const selection = editor.selection;
			const start = await getNumberInput('The new starting AC#. Must be > 0.');
			const step = await getNumberInput('The step size between AC#s. Must be > 0.');

			if (!(selection && start && step)) {
				return false;
			}

			let text = document.getText(selection);

			let ret: string[] = [];
			let previousOldNum = null;
			let currentOldNum = null;
			let currentNum = null;
			for (let line of text.split('\n')) {
				if (line.trim().startsWith('AC#')) {
					// Find line's AC#
					const match = line.match(/AC#(\d+),/);
					if (match && match[1]) {
						currentOldNum = Number(match[1]);

						// Number change
						if (currentOldNum !== previousOldNum) {
							if (!currentNum) {
								currentNum = start;
							} else {
								currentNum = currentNum + step;
							}
							previousOldNum = currentOldNum;
						}

						line = line.replace('AC#' + currentOldNum, 'AC#' + currentNum);
					}
				}

				ret.push(line);
			}
			const newText = ret.join('\n');

			editor.edit((editBuilder) => {
				editBuilder.replace(selection, newText);
			});
			window.showInformationMessage(`Selected AC#s rebased to ${start}`);
		}
	}
}

async function getNumberInput(placeholderText: string) {
	const result = await window.showInputBox({
		value: '1',
		valueSelection: undefined,
		placeHolder: placeholderText,
		prompt: placeholderText,
		validateInput: (text) => {
			// window.showInformationMessage(`Validating "${text}"`);
			if (text.length === 0) {
				return 'Anything? Anything at all?!';
			}
			if (text === '0') {
				return 'Maybe a little more?';
			}
			if (isNaN(Number(text))) {
				return "This isn't a number";
			}
			if (Number(text) <= 0) {
				return 'Must be greater than zero';
			}
			if (text.search(/\./) >= 0) {
				return 'Number must not have decimals';
			}
			return null;
		},
	});
	return Number(result);
}
