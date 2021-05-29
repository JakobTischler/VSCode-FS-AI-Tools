import * as Path from 'path';
import * as Fs from 'fs';
import { window, Position } from 'vscode';

export async function CreateFlightplanHeaderFromAifp() {
	console.log('CreateFlightplanHeaderFromAifp()');

	const editor = window.activeTextEditor;
	if (
		!(
			editor &&
			'file' === editor.document.uri.scheme &&
			Path.basename(editor.document.uri.path).toLocaleLowerCase().startsWith('flightplans')
		)
	) {
		window.showErrorMessage('Header can only be created when in a "Flightplans.txt" file');
		return false;
	}

	/*
	Flow:
	1. If aifp.cfg exists in same directory as current flightplan file
	   else: return false, msg
	2. Read aifp.cfg data, parse and get
	   * AIRLINE
	   * AIRLINE_ICAO
	   * CALLSIGN
	   * SEASON
	   * PROVIDER
	   * FS_Version
	3. Create text
	4. Append text to top of file
	   Delete existing lines?
	*/

	let aifpPath = Path.join(Path.dirname(editor.document.uri.path), 'aifp.cfg');
	while (aifpPath.startsWith('\\')) {
		aifpPath = aifpPath.substr(1);
	}
	console.log({ aifpPath });

	if (Fs.existsSync(aifpPath)) {
		Fs.readFile(aifpPath, 'utf8', (err, contents) => {
			console.log(contents);

			const data: { [key: string]: string } = {};
			data['fsx'] = 'false';

			// TODO PARSE
			for (const line of contents.split('\n')) {
				const lineSplit = line.trim().split('=');
				if (lineSplit.length === 2) {
					let [k, v] = lineSplit;
					switch (k.toLowerCase()) {
						case 'airline':
							data.airline = v;
							break;
						case 'airline_icao':
							data.icao = v;
							break;
						case 'callsign':
							data.callsign = v;
							break;
						case 'season':
							data.season = v;
							const match = data.season.match(/(Spring|Summer|Winter) (\d{2,4})([-\/](\d{2,4}))?/i);

							// console.log('season match', match);
							// ['Summer 2021', 'Summer', '2021', undefined, undefined, index: 0, input: 'Summer 2021', groups: undefined]
							// ['Winter 2021/2022', 'Winter', '2021', '/2022', '2022', index: 0, input: 'Winter 2021/2022', groups: undefined]
							if (match) {
								data.season = match[1].substr(0, 2);
								let year = match[2].length === 4 ? match[2].substr(2, 2) : match[2];
								// Two years
								if (match[4]) {
									if (match[4].length === 4) {
										year += match[4].substr(2, 2);
									} else {
										year += match[4];
									}
								}
								data.season += year;
							}
							break;
						case 'provider':
							data.author = v;
							break;
						case 'fs_version':
							if (v === 'FSX') {
								data.fsx = 'true';
							}
							break;
						default:
						// Do nothing
					}
				}
			}

			if (data.airline && data.author && data.season) {
				let text = `//FSXDAYS=${data.fsx.toString().toUpperCase()}\n`;
				text += `//${data.airline}`;
				if (data.icao || data.callsign) {
					text += ` | ${data.icao ? data.icao.toUpperCase() : '___'}`;
					text += ` | "${data.callsign ? `${data.callsign.toUpperCase()}` : ''}"`;
				}
				text += '\n';
				text += `//${data.author}, ${data.season}\n\n`;

				editor.edit((editBuilder) => {
					editBuilder.insert(new Position(0, 0), text);
				});
				window.showInformationMessage(`Header for ${data.airline} created`);
			}
		});
	}
}
