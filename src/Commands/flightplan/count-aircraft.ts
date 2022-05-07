import { Range, window, workspace } from 'vscode';

export async function CountAircraft() {
	const editor = window.activeTextEditor;
	if (editor) {
		let total = 0;
		let numTypes = 0;
		let currentGroupCount = 0;
		let currentGroupLineIndex = null;
		let newGroup = true;
		let emptyLineCounter = 0;
		const minEmptyLinesForNewGroup = Number(
			workspace.getConfiguration('fs-ai-tools.countAircraft', undefined).get('emptyLinesBetweenGroups') || 1
		);

		const document = editor.document;
		const selection = editor.selection;
		const text = document.getText(!selection.isEmpty ? selection : undefined);
		const lines = text.split('\n');

		/*
		 * Go through each line
		 */
		for (const [index, line] of lines.entries()) {
			const isLastLine = index === lines.length - 1;

			/*
			 * Empty Line
			 */
			if (!line.trim().length) {
				emptyLineCounter++;

				if (emptyLineCounter >= minEmptyLinesForNewGroup) {
					emptyLineCounter = 0;
					newGroup = true;
				}

				if (!isLastLine) continue;
			} else {
				emptyLineCounter = 0;
			}

			/*
			 * New group
			 */
			if (line.startsWith('//') || isLastLine) {
				if (newGroup || isLastLine) {
					/*
					 * Close current group
					 */
					if (currentGroupLineIndex !== null && currentGroupCount > 0) {
						writeCountToHeaderLine(lines, currentGroupLineIndex, currentGroupCount);

						total += currentGroupCount;
						numTypes++;

						if (!isLastLine) {
							currentGroupLineIndex = index;
							currentGroupCount = 0;
						}
					}

					currentGroupLineIndex = index;
					newGroup = false;
				}
				// Count aircraft
			} else if (line.startsWith('AC#')) {
				currentGroupCount++;
			}
		}

		/*
		 * Write new text to document
		 */
		const range = !selection.isEmpty
			? selection
			: new Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);

		editor.edit((editBuilder) => {
			editBuilder.replace(range, lines.join('\n'));
		});

		window.showInformationMessage(`Aircraft counted (${total} total, with ${numTypes} different types)`);
	}
}

function writeCountToHeaderLine(lines: string[], headerLineIndex: number, count: number) {
	let text = lines[headerLineIndex].trim();

	// Remove existing count
	const existingCount = text.match(/^\/\/.*(\[.+\])/);
	if (existingCount?.[1]) {
		text = text.substring(0, text.length - existingCount[1].length);
	}

	text = `${text.trim()} [${count}]`;

	lines[headerLineIndex] = text;
}
