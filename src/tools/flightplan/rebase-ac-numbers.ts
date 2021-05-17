import { window } from 'vscode';
import { getFilenameFromPath, roundUpToNearest } from '../../helpers';

export async function RebaseAircraftNumbers() {
	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && (filename.startsWith('aircraft') || filename.startsWith('flightplans'))) {
			const selection = editor.selection;
			const start = await getNumberInput('1', 'The new starting AC#. Must be > 0.');
			const bigStep = await getNumberInput('10', 'The step size between groups (separated by empty lines). Must be > 0.');
			const smallStep = await getNumberInput('1', 'The step size between AC#s within groups. Must be > 0.');

			if (!(selection && start && bigStep && smallStep)) {
				return false;
			}

			let text = document.getText(selection);

			let ret: string[] = [];
			let previousOldNum = null;
			let currentOldNum = null;
			let currentGroupNum = start;
			let currentSingleNum = start;
			let anyNumberInGroupReplaced = false;

			for (let line of text.split('\n')) {
				let l = line.trim();

				if (l.length === 0 && anyNumberInGroupReplaced) {
					// currentSingleNum + 10 -> floor
					currentGroupNum = roundUpToNearest(currentSingleNum, bigStep);
					currentSingleNum = currentGroupNum;
					anyNumberInGroupReplaced = false;
				} else if (line.trim().startsWith('AC#')) {
					// Find line's AC#
					const match = line.match(/AC#(\d+),/);
					if (match && match[1]) {
						currentOldNum = Number(match[1]);

						// Number change
						if (currentOldNum !== previousOldNum) {
							if (anyNumberInGroupReplaced) {
								currentSingleNum = currentSingleNum + smallStep;
							}
							previousOldNum = currentOldNum;
						}

						line = line.replace('AC#' + currentOldNum, 'AC#' + currentSingleNum);
						anyNumberInGroupReplaced = true;
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

async function getNumberInput(value: string = '1', placeholderText: string) {
	const result = await window.showInputBox({
		value: value,
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
