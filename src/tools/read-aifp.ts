import { getFileContents, showError } from './helpers';

export interface AifpData {
	found: boolean;
	airline?: string;
	icao?: string;
	callsign?: string;
	season?: string;
	author?: string;
	fsx?: boolean;
}

/**
 * Reads the `aifp.cfg` file at the given path, and returns an object with the parsed contents
 * @param path The full path of the `aifp.cfg` file
 * @returns The contents of the `aifp.cfg` file, pased into an object
 */
export async function readAifpCfg(path: string, showExistError: boolean = true): Promise<AifpData> {
	console.log('readAifpCfg()', path);

	// Remove start backslashes at path
	path = path.replace(/^\\+/, '');

	/*
	1. If aifp.cfg exists in same directory as current flightplan file
	   else: error msg
	2. Read aifp.cfg data, parse and get
	   * AIRLINE
	   * AIRLINE_ICAO
	   * CALLSIGN
	   * SEASON
	   * PROVIDER
	   * FS_Version
	*/

	const data: AifpData = {
		found: false,
	};

	const contents = await getFileContents(path, showExistError);
	if (!contents) {
		// showError(`No file contents found in "${path}".`);
		return data;
	}

	console.log(contents);

	data.found = true;
	data.fsx = false;

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
					data.fsx = v === 'FSX';
					break;
				default:
					break;
			}
		}
	}
	return data;
}
