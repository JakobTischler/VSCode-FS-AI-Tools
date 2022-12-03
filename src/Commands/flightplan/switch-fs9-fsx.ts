import { window } from 'vscode';
import { getFilenameFromPath, showError } from '../../Tools/helpers';
import { getDropdownSelection } from '../../Tools/input';

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

	let flightplansChanged = 0;

	const selection = editor.selection;
	const text = document.getText(selection);

	// Get direction
	const dirStr = await getDropdownSelection('Select switch direction', ['FS9 → FSX', 'FSX → FS9']);
	if (!dirStr) {
		return false;
	}
	const toFS9 = dirStr === 'FSX → FS9';

	// Go through each line, check the max number of days based on repeating
	// period, then match days and loop number
	const periods = new Map();
	periods.set('WEEK', 1 * 7 - 1);
	periods.set('2WEEKS', 2 * 7 - 1);
	periods.set('5WEEKS', 5 * 7 - 1);
	periods.set('8WEEKS', 8 * 7 - 1);

	const lines = text.split('\n');
	for (const [index, line] of lines.entries()) {
		if (!line.startsWith('AC#')) {
			continue;
		}

		const split = line.split(',');
		const period = split[3]?.toUpperCase();
		if (!period) {
			showError(`Aircraft "${split[1]}": Couldn't find any repeating period`);
			continue;
		}
		if (!periods.has(period)) {
			showError(`Aircraft "${split[1]}": invalid repeating period "${period}"`);
			continue;
		}
		const maxDays = periods.get(period);

		lines[index] = line.replace(/(\,@?(?:TNG)?)(\d+)\//gi, (fullMatch, pre: string, number: string) => {
			// In FS9 the week starts on Sunday which has the number 0. In FSX the week starts on Monday with the number 0.
			//      M T W T F S S
			// FS9: 1 2 3 4 5 6 0
			// FSX: 0 1 2 3 4 5 6
			// FS9 → FSX = -1
			// FSX → FS9 = +1
			let num = Number(number);
			num = num.loop(0, maxDays, toFS9 ? 1 : -1);

			return `${pre}${num}/`;
		});

		flightplansChanged++;
	}

	editor.edit((editBuilder) => {
		editBuilder.replace(selection, lines.join('\n'));
	});

	const from = toFS9 ? 'FSX' : 'FS9';
	const to = toFS9 ? 'FS9' : 'FSX';
	window.showInformationMessage(`${'flightplan'.plural(flightplansChanged)} changed from ${from} to ${to}`);
}
