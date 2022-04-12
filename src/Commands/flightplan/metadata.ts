import * as vscode from 'vscode';
import * as path from 'path';
import { readAifpCfg } from '../../Tools/read-aifp';
import { showErrorModal, writeTextToClipboard } from '../../Tools/helpers';

export async function FlightplanMetadata() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const dirPath = path.dirname(document.fileName).replace(/^\/+/, '');

		const aifpData = await readAifpCfg(path.join(dirPath, 'aifp.cfg'));

		if (!aifpData.found) {
			showErrorModal(`aifp.cfg not found`, `The flightplan's aifp.cfg file is required to gather the metadata.`);
			return false;
		}

		// Get current date time
		const date = new Date()
			.toLocaleDateString('en-US', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			})
			.replace(',', '');

		const outputData = {
			update: date,
			compiled: date,
			author: aifpData.author || '',
			type: '',
			season: aifpData.season || '',
			acNum: '',
		};

		// Get flightplan type
		const typeMatch = document.fileName.match(/(Business|Cargo|Passenger|Official|General Aviation)/);
		if (typeMatch?.length) {
			outputData.type = getInitials(typeMatch[1]);
		}

		// Get lowest AC#
		if ('file' === document.uri.scheme) {
			const text = document.getText();

			const acNums = text.matchAll(/AC#(\d+)+/gim);
			const acNumsAr = [...acNums];
			if (acNumsAr?.length) {
				const numbers = acNumsAr.map((match) => Number(match[1]));

				let lowest = Math.min(...numbers);

				// Round down to nearest 100
				lowest = Math.floor(lowest / 100) * 100;

				outputData.acNum = String(lowest);
			}
		}

		// ------------------------------------------

		const output = [
			outputData.update,
			outputData.compiled,
			'',
			outputData.author,
			outputData.type,
			outputData.season,
			outputData.acNum,
		].join(`\t`);

		vscode.window
			.showInformationMessage(`Metadata for ${aifpData.airline}`, { modal: true, detail: output }, 'Copy')
			.then((buttonText) => {
				if (buttonText) {
					writeTextToClipboard(output, 'Copied to clipboard');
				}
			});
	}
}
function getInitials(text: string) {
	const regex = /(\p{L}{1})\p{L}+/gu;

	const initials = [...text.matchAll(regex)] || [];
	console.log({ initials });

	const i = initials.map((data) => data[1]).join('');

	return i || '';
}
