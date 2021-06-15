import { group } from 'console';
import { window } from 'vscode';
import { getFilenameFromPath, roundUpToNearest } from '../../helpers';

export async function CountAircraft() {
	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && (filename.startsWith('aircraft') || filename.startsWith('flightplans'))) {
			const selection = editor.selection;

			if (!selection) {
				return false;
			}

			let text = document.getText(selection);
			let total = 0;
			let numTypes = 0;
			let groupCount: number = 0;
			let currentGroupLineIndex = null;

			let lines = text.split('\n');
			for (let index = 0; index < lines.length; index++) {
				const isLastLine = index === lines.length - 1;
				let line = lines[index];

				if (!isLastLine && line.length === 0) {
					continue;
				}

				// New group or end of file
				if ((line.startsWith('//') && lines[index + 1]?.startsWith('AC#')) || isLastLine) {
					if (currentGroupLineIndex !== null) {
						// Append count text to header line
						total += groupCount;

						let text = lines[currentGroupLineIndex].trim();
						let existingCount = text.match(/^\/\/.*(\[.+\])/);
						if (existingCount && existingCount[1]) {
							text = text.substr(0, text.length - existingCount[1].length);
						}

						text = text.trim() + ` [${groupCount}]`;
						lines[currentGroupLineIndex] = text;
					}

					if (!isLastLine) {
						currentGroupLineIndex = index;
						groupCount = 0;
						numTypes++;
					}

					// Count aircraft
				} else if (line.startsWith('AC#')) {
					groupCount++;
				}
			}

			text = lines.join('\n');
			editor.edit((editBuilder) => {
				editBuilder.replace(selection, text);
			});
			window.showInformationMessage(`Aircraft counted (${total} total, with ${numTypes} different types)`);
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
