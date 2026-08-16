import * as vscode from 'vscode';
import { getFilename, replaceDocumentContents } from '../../Tools/helpers';
import {
	changeComments,
	formatTimes,
	padFlightLevels,
	padFlightNumbers,
	randomizePercentage,
	transformToUppercase,
} from '../../Services/flightplan-transformations';

export async function CleanFlightplan() {
	const config = vscode.workspace.getConfiguration('fs-ai-tools.cleanFlightplan', undefined);

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilename(document.uri.path).toLocaleLowerCase();
		if ('file' === document.uri.scheme && filename.startsWith('flightplans')) {
			let text = document.getText();

			// Change airports
			const airportList = config.changeAirports;
			if (airportList && airportList !== null && airportList.length > 0) {
				for (let set of airportList) {
					set = set.split(':').map((icao: string) => icao.trim().toUpperCase());

					if (set[0].length > 2 && set[1].length > 2) {
						const old = new RegExp(`,${set[0]}`, 'gi');
						text = text.replace(old, `,${set[1]}`);
					}
				}
			}

			const commentsNumSpaces =
				config.adjustComments === '1 space' ? 1 : config.adjustComments === 'No space' ? 0 : -1;

			const ret = [];
			const splitData = text.trim().split('\n');
			for (let line of splitData) {
				if (line.startsWith('AC#') || line.startsWith('ac#') || line.startsWith('//#')) {
					if (config.removeSeconds || config.addAtToArrivalTimes) {
						line = formatTimes(line, config.removeSeconds, config.addAtToArrivalTimes);
					}

					if (config.randomPercentages) {
						line = randomizePercentage(line, config.randomPercentagesMin, config.randomPercentagesMax);
					}

					if (config.uppercase) {
						line = transformToUppercase(line);
					}

					if (config.leadingZeroesFlightnumbers) {
						line = padFlightNumbers(line);
					}

					if (config.leadingZeroesFlightLevels) {
						line = padFlightLevels(line);
					}
				}

				// Adjust comments
				if (commentsNumSpaces > -1 && line.trimStart().startsWith('//')) {
					line = changeComments(line, commentsNumSpaces);
				}

				ret.push(line);
			}
			ret.push('');
			const fp = ret.join('\n');

			// Apply changes to document
			await replaceDocumentContents(editor, fp);

			vscode.window.showInformationMessage('Flightplan cleaned');
		}
	}
}
