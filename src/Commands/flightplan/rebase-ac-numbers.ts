import { window, workspace, Range } from 'vscode';
import { getFilename, showError } from '../../Tools/helpers';
import { getNumberInput } from '../../Tools/input';

export async function RebaseAircraftNumbers() {
	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilename(document.uri.path).toLocaleLowerCase();
		const isAircraftTxt = filename.startsWith('aircraft');
		const isFlightplansTxt = filename.startsWith('flightplans');
		if (!('file' === document.uri.scheme && (isAircraftTxt || isFlightplansTxt))) {
			return;
		}

		const selection = editor.selection;
		const text = document.getText(!selection.isEmpty ? selection : undefined);

		const existingStartNumber = text.match(/AC#(\d+)/i)?.[1];
		if (!existingStartNumber) {
			showError('No existing AC# found.', true);
			return false;
		}

		const start = await getNumberInput(existingStartNumber || '1000', 'The new starting AC#. Must be > 0.');
		const bigStep = await getNumberInput(
			'10',
			'The step size between groups (separated by empty lines). Must be > 0.'
		);
		const smallStep = await getNumberInput('1', 'The step size between AC#s within groups. Must be > 0.');

		if (!(start && bigStep && smallStep)) {
			return false;
		}

		// Get config
		const config = workspace.getConfiguration('fs-ai-tools.rebaseAircraftNumbers', undefined);

		// Numbering variables
		const ret: string[] = [];
		let previousOldNum = null;
		let currentOldNum = null;
		let currentGroupNum = start;
		let currentSingleNum = start;
		let anyNumberInGroupReplaced = false;

		// Empty lines variables
		const minEmptyLinesForNewGroup = isAircraftTxt
			? Number(config.get('emptyLinesBetweenGroupsAircraftTxt'))
			: Number(config.get('emptyLinesBetweenGroupsFlightplansTxt'));
		let emptyLineCounter = 0;

		for (let line of text.split('\n')) {
			const l = line.trim();

			// Empty Line
			let newGroup = false;
			if (l.length === 0) {
				emptyLineCounter++;

				if (emptyLineCounter >= minEmptyLinesForNewGroup) {
					emptyLineCounter = 0;
					newGroup = true;
				}
			} else {
				emptyLineCounter = 0;
			}

			// Create new group
			if (newGroup && anyNumberInGroupReplaced) {
				// currentSingleNum + 10 -> floor
				currentGroupNum = currentSingleNum.roundUpToNearest(bigStep);
				currentSingleNum = currentGroupNum;
				anyNumberInGroupReplaced = false;
				newGroup = false;
			} else if (line.trim().startsWith('AC#')) {
				// Handle aircraft line
				if (isAircraftTxt) {
					if (anyNumberInGroupReplaced) {
						currentSingleNum += smallStep;
					}
					line = line.replace(/AC#\d+,/, `AC#${currentSingleNum},`);
					anyNumberInGroupReplaced = true;
				} else if (isFlightplansTxt) {
					// Find line's AC#
					const match = line.match(/AC#(\d+),/);
					if (match && match[1]) {
						currentOldNum = Number(match[1]);

						// Number change
						if (currentOldNum !== previousOldNum) {
							if (anyNumberInGroupReplaced) {
								currentSingleNum += smallStep;
							}
							previousOldNum = currentOldNum;
						}

						line = line.replace(`AC#${currentOldNum}`, `AC#${currentSingleNum}`);
						anyNumberInGroupReplaced = true;
					}
				}
			}

			ret.push(line);
		}
		const newText = ret.join('\n');

		editor.edit((editBuilder) => {
			const range = !selection.isEmpty
				? selection
				: new Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);
			editBuilder.replace(range, newText);
		});
		window.showInformationMessage(`Selected AC#s rebased to ${start}`);
	}
}
