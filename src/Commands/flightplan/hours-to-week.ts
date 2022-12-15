import { Range, window } from 'vscode';
import * as path from 'path';
import { showError } from '../../Tools/helpers';

type TPeriod = '1HR' | '2HR' | '4HR' | '8HR' | '12HR' | '24HR';
const periods = new Map(<[TPeriod, number][]>[
	['1HR', 1],
	['2HR', 2],
	['4HR', 4],
	['8HR', 8],
	['12HR', 12],
	['24HR', 24],
]);

export async function HoursToWeek() {
	console.log('CreateFlightplanHeader()');

	const editor = window.activeTextEditor;
	if (!editor) return;

	const document = editor.document;
	const filename = path.basename(document.uri.path).toLocaleLowerCase();
	if (!('file' === document.uri.scheme && filename.toLocaleLowerCase().startsWith('flightplans'))) return;

	const selection = editor.selection;
	const text = document.getText(!selection.isEmpty ? selection : undefined);

	const lines = text.trim().split('\n');

	let numConversions = 0;

	for (const [index, line] of lines.entries()) {
		if (line.toLowerCase().startsWith('ac#') || line.startsWith('//#')) {
			const split = line.split(',');
			const period = <TPeriod>split[3]?.toUpperCase();
			if (!period) {
				showError(`Aircraft "${split[1]}": Couldn't find any repeating period`);
				continue;
			}
			if (!periods.has(period)) {
				/* showError(
					`Aircraft "${split[1]}": invalid repeating period "${period}". Must be either of ${[
						...periods.keys(),
					].join(', ')}`
				); */
				continue;
			}

			const data = parseFlightplanLine(line, period as TPeriod);
			if (data) {
				lines[index] = data.join(',');
				numConversions++;
				continue;
			}
		}

		lines[index] = line;
	}
	// console.log({ lines });

	const newText = lines.join('\n');

	editor.edit((editBuilder) => {
		const range = !selection.isEmpty
			? selection
			: new Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);
		editBuilder.replace(range, newText);
	});

	window.showInformationMessage(`${'flightplan line'.plural(numConversions)} converted`);
}

function parseFlightplanLine(line: string, period: TPeriod) {
	const split = line.split(',');
	const ret = [...split.slice(0, 3), 'WEEK', split[4]];

	const expr =
		/,(?<dep>(?<depHour>\d+):(?<depMin>\d+(?::\d+)?)),(?<atOrTng>@|TNG)?(?<arr>(?<arrHour>\d+):(?<arrMin>\d+(?::\d+)?)),(?<rest>\d+,[FR],\d+,\w+)/gi;
	const legs = [...line.matchAll(expr)];

	const repeatPeriod = periods.get(period);
	if (!repeatPeriod) {
		showError(`Aircraft "${split[1]}": Couldn't match period "${period} to validPeriods.`);
		return;
	}
	const perDay = 24 / repeatPeriod;

	const dayLegs: (string | number)[][] = [];
	const allLegs: (string | number)[][] = [];

	/*
	 * Repeat n times during the day
	 */
	for (let index = 0; index < perDay; index++) {
		for (const leg of legs) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [input, dep, depHour, depMin, atOrTng, arr, arrHour, arrMin, rest] = leg;

			const newDepHour = (Number(depHour) + repeatPeriod * index) % 24;
			const newArrHour = (Number(arrHour) + repeatPeriod * index) % 24;

			const newDep = `${newDepHour.pad(2)}:${depMin}`;
			const newArr = `${newArrHour.pad(2)}:${arrMin}`;

			const newInput = `${newDep},${atOrTng || ''}${newArr},${rest}`;

			const newLeg = [
				`,${newInput}`,
				newDep,
				newDepHour,
				depMin,
				atOrTng || '',
				newArr,
				newArrHour,
				arrMin,
				rest,
			];

			dayLegs.push(newLeg);
		}
	}
	console.log({ dayLegs });

	/*
	 * Repeat each day 7 times for the full week
	 */
	for (let day = 0; day < 7; day++) {
		for (const leg of dayLegs) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [input, dep, depHour, depMin, atOrTng, arr, arrHour, arrMin, rest] = leg;

			const depTimeNorm = Number(depHour) + Number(depMin) / 60;
			const arrTimeNorm = Number(arrHour) + Number(arrMin) / 60;

			const depDay = day;
			const arrDay = arrTimeNorm > depTimeNorm ? day : day + 1;

			const newInput = `${depDay}/${dep},${atOrTng}${arrDay}/${arr},${rest}`;

			const newLeg = [`,${newInput}`, dep, depHour, depMin, atOrTng, arr, arrHour, arrMin, rest];

			allLegs.push(newLeg);

			ret.push(newInput);
		}
	}
	// console.log({ allLegs, ret });

	return ret;
}
