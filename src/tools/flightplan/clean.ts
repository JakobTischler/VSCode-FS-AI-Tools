import * as vscode from 'vscode';
import { getRandomInt, padNumber, getFilenameFromPath } from '../../helpers';

export function CleanFlightplan() {
	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && filename.startsWith('flightplans')) {
			let text = document.getText();

			// Change airports
			let airportList = config.cleanFlightplan.changeAirports;
			if (airportList && airportList !== null && airportList.length > 0) {
				for (let set of airportList) {
					set = set.split(':').map((icao: string) => icao.trim().toUpperCase());

					if (set[0].length > 2 && set[1].length > 2) {
						let old = new RegExp(`,${set[0]}`, 'gi');
						text = text.replace(old, `,${set[1]}`);
					}
				}
			}

			const ret = [];
			const splitData = text.trim().split('\n');
			for (let line of splitData) {
				if (line.startsWith('AC#') || line.startsWith('//#')) {
					if (config.cleanFlightplan.removeSeconds || config.cleanFlightplan.addAtToArrivalTimes) {
						line = formatTimes(line, config.cleanFlightplan.removeSeconds, config.cleanFlightplan.addAtToArrivalTimes);
					}

					if (config.cleanFlightplan.randomPercentages) {
						line = randomizePercentage(
							line,
							config.cleanFlightplan.randomPercentagesMin,
							config.cleanFlightplan.randomPercentagesMax
						);
					}

					if (config.cleanFlightplan.uppercase) {
						line = transformToUppercase(line);
					}

					if (config.cleanFlightplan.leadingZeroesFlightnumbers) {
						line = padFlightNumbers(line);
					}

					if (config.cleanFlightplan.leadingZeroesFlightLevels) {
						line = padFlightLevels(line);
					}
				}
				ret.push(line);
			}
			ret.push('');
			const fp = ret.join('\n');

			// Apply changes to document
			editor.edit((editBuilder) => {
				editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 5000), fp);
			});
			vscode.window.showInformationMessage('Flightplan cleaned');
		}
	}
}

/**
 * If `removeSeconds` is true: changes an `hh:mm:ss` time to `hh:mm`.
 * If `addAtToDepTimes` is true: changes departure `d/hh:mm` times to `@d/hh:mm`.
 * Returns the complete string.
 * @test https://regex101.com/r/zTB7O2/8
 */
function formatTimes(text: string, removeSeconds: boolean, addAtToDepTimes: boolean): string {
	const regex = /((?:\d{1}\/)?\d{2}:\d{2})(:\d{2})?,@?((?:\d{1}\/)?\d{2}:\d{2})(:\d{2})?/gi;
	let subst;
	if (removeSeconds && !addAtToDepTimes) {
		subst = '$1,$4';
	} else if (!removeSeconds && addAtToDepTimes) {
		subst = '$1$2,@$3$4';
	} else {
		subst = '$1,@$3';
	}
	text = text.replace(regex, subst);
	return text;
}

/**
 * Randomizes the flightplan percentage between the provided min and max values (default `min=10` and `max=99`). Returns the complete string.
 */
function randomizePercentage(text: string, min: number = 10, max: number = 99): string {
	const regex = /(\d+%)/g;
	if (min === max) {
		return text.replace(regex, min + '%');
	}
	return text.replace(regex, (v) => {
		return getRandomInt(min, max) + '%';
	});
}

/**
 * Transforms the flightplan to uppercase. Returns the complete string.
 */
function transformToUppercase(text: string): string {
	return text.toUpperCase();
}

/**
 * Pads the flightnumbers to a `0000` format. Returns the complete string.
 */
function padFlightNumbers(text: string): string {
	text = text.replace(/,([FfRr]{1}),(\d+)/gi, (fullMatch, g1, g2) => {
		return `,${g1},${padNumber(g2, 4)}`;
	});
	return text;
}

/**
 * Pads the flight levels to a `000` format. Returns the complete string.
 */
function padFlightLevels(text: string): string {
	text = text.replace(/,(\d+),([FfRr]{1})/gi, (fullMatch, g1, g2) => {
		return `,${padNumber(g1, 3)},${g2}`;
	});
	return text;
}
