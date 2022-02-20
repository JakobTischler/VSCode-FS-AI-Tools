import { window } from 'vscode';
import { getFilenameFromPath } from '../../Tools/helpers';

export async function CountAircraft() {
	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && filename.startsWith('flightplans')) {
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
				if (line.startsWith('//') || isLastLine) {
					// Current group complete → append count text to header line
					if (currentGroupLineIndex !== null && groupCount > 0) {
						total += groupCount;

						let text = lines[currentGroupLineIndex].trim();
						let existingCount = text.match(/^\/\/.*(\[.+\])/);
						if (existingCount && existingCount[1]) {
							text = text.substr(0, text.length - existingCount[1].length);
						}

						text = `${text.trim()} [${groupCount}]`;
						lines[currentGroupLineIndex] = text;

						numTypes++;
					}

					if (!isLastLine) {
						currentGroupLineIndex = index;
						groupCount = 0;
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
