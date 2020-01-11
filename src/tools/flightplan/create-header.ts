import { window, Position } from 'vscode';
import { capitalize, getFilenameFromPath } from '../../helpers';

export async function CreateFlightplanHeader() {
	console.log('CreateFlightplanHeader()');

	const editor = window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		const filename = getFilenameFromPath(document.uri.path);
		if (
			'file' === document.uri.scheme &&
			filename.toLocaleLowerCase().startsWith('flightplans')
		) {
			let filenameTest = filename.split('_');
			let proposedIcao = 'ICAO';
			let proposedName = 'Airline Name';
			console.log('filenameTest', filenameTest);
			if (filenameTest.length > 1) {
				if (filenameTest.length === 3 && filenameTest[1].length <= 4) {
					proposedIcao = filenameTest[1];
					proposedName = filenameTest[2];
					proposedName = proposedName.substring(0, proposedName.length - 4);
				} else if (filenameTest.length === 2) {
					proposedName = filenameTest[1];
					proposedName = proposedName.substring(0, proposedName.length - 4);
				}
				console.log('proposedName', proposedName);
				console.log('proposedIcao', proposedIcao);
			}

			const fsVersion = await getFsVersion();
			const name = await getName(proposedName);
			const icao = await getIcao(proposedIcao);
			const callsign = await getCallsign();
			const author = await getAuthor();
			const season = await getSeason();

			console.log({
				fsVersion,
				name,
				icao,
				callsign,
				author,
				season
			});
			if (fsVersion && name && author && season) {
				let text = `//FSXDAYS=${fsVersion === 'FS9' ? 'FALSE' : 'TRUE'}\n`;
				text += `//${capitalize(name)}`;
				if (icao || callsign) {
					text += ` | ${icao ? icao.toUpperCase() : ''}`;
					text += ` | "${callsign ? `${callsign.toUpperCase()}` : ''}"`;
				}
				text += '\n';
				text += `//${capitalize(author, true)}, ${season}\n\n`;

				console.log(text);

				editor.edit(editBuilder => {
					editBuilder.insert(new Position(0, 0), text);
				});
				window.showInformationMessage(`Header for ${name} created`);
			}
		}
	}
}

/**
 * Shows a pick list using window.showQuickPick().
 * @source [VSCode Extension Samples](https://github.com/Microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/basicInput.ts)
 */
async function getFsVersion() {
	// let i = 0;
	const result = await window.showQuickPick(['FS9', 'FSX'], {
		placeHolder: 'FS9 or FSX'
		// onDidSelectItem: item => window.showInformationMessage(`Focus ${++i}: ${item}`)
	});
	// window.showInformationMessage(`Got: ${result}`);
	return result;
}

async function getName(proposedName: string) {
	const result = await window.showInputBox({
		value: proposedName,
		valueSelection: undefined,
		placeHolder: "The airline's name",
		validateInput: text => {
			if (text.length === 0) {
				return 'Surely there must be a name!';
			}
			return null;
		}
	});
	return result;
}

async function getIcao(proposedIcao: string) {
	const result = await window.showInputBox({
		value: proposedIcao,
		valueSelection: undefined,
		placeHolder: "The airline's ICAO code",
		validateInput: text => {
			if (text.length > 4) {
				return 'The usual limit is four characters';
			}
			return null;
		}
	});
	return result;
}

async function getCallsign() {
	const result = await window.showInputBox({
		value: 'Callsign',
		valueSelection: undefined,
		placeHolder: "The airline's callsign"
	});
	return result;
}
async function getAuthor() {
	const result = await window.showInputBox({
		value: 'Author Name',
		valueSelection: undefined,
		placeHolder: "The flightplan's author",
		validateInput: text => {
			if (text.length === 0) {
				return 'Surely there must be a name!';
			}
			return null;
		}
	});
	return result;
}

async function getSeason() {
	const re = /(Su|Wi)\d{2,4}/g;
	const result = await window.showInputBox({
		value: 'Season',
		valueSelection: undefined,
		placeHolder: "The flightplan's season (Su19 or Wi1718)",
		validateInput: text => {
			if (!text.match(re)) {
				return 'The season should be in the format "Su19" or "Wi1718"';
			}
			return null;
		}
	});
	return result;
}
