import * as vscode from 'vscode';
import { replacePartAtPos, arrayMove } from '../../helpers';
// import { create } from 'domain';

type FltsimEntry = { [key: string]: string };

export async function CleanAircraftCfg() {
	console.log('CleanAircraftCfg() v2');

	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if (
			'file' === document.uri.scheme &&
			document.uri.path.toLocaleLowerCase().endsWith('aircraft.cfg')
		) {
			let text = document.getText();
			// text = text.replace('\r', '');
			const splitText = text.split('\n');
			// const splitText = splitLines(text);
			const textLineLength = splitText.length;

			/**
			 * The final lines array.
			 */
			let cleanTextArray: string[] = [];

			/**
			 * The current cfg sub-section in the line iteration.
			 */
			let currentSection: string | null = null;
			let isFltsimSection: boolean = false;

			/**
			 * The current fltsim entry's data.
			 */
			let currentFltsimEntry = createEmptyEntry();

			/**
			 * List of all entries, with each entry being an object
			 */
			const fltsimEntries: FltsimEntry[] = [];

			// Split lines and iterate through
			splitText.forEach((line, i) => {
				line = line.trim();

				if (line.length > 0) {
					let isSectionStart = line.startsWith('[') && line.endsWith(']');
					// New section start
					if (isSectionStart) {
						// Close old section and push to list
						if (currentSection && isFltsimSection) {
							fltsimEntries.push(currentFltsimEntry);
						}

						currentSection = line;
						isFltsimSection = currentSection.startsWith('[fltsim.');
						if (isFltsimSection) {
							currentFltsimEntry = createEmptyEntry();
							currentFltsimEntry['_header'] = line;
						}
					}

					// Handle line
					if (currentSection && isFltsimSection) {
						if (!isSectionStart) {
							let add = true;

							const prop = line.split('=');
							let key = prop[0].toLowerCase();
							let value = prop[1];

							// Remove unused lines
							if (config.aircraftcfgRemoveUnusedLines) {
								if (
									(key === 'atc_heavy' && value === '0') ||
									(key === 'atc_id' && value.length > 0) ||
									key === 'atc_id_color' ||
									key === 'visual_damage' ||
									key === 'atc_flight_number'
								) {
									add = false;
								}
							}

							// Callsign uppercase
							if (config.aircraftcfgCallsignsUppercase && key === 'atc_airline') {
								value = value.toUpperCase();
							}

							if (key === 'model') {
								key = 'model';
							}

							// Add to fltsim entry
							if (add) {
								currentFltsimEntry[key] = value;
							}
						}
					} else {
						cleanTextArray.push(line);
					}
				} else {
					if (currentSection && isFltsimSection) {
						//ignore line
					} else {
						cleanTextArray.push(line);
					}
				}

				// Last line, push entry to list if necessary
				if (i === splitText.length - 1 && currentSection && isFltsimSection) {
					fltsimEntries.push(currentFltsimEntry);
				}
			});

			// Renumber
			if (config.aircraftcfgRenumber) {
				// text = renumberFltsimEntries(text);
				fltsimEntries.forEach((entry, i) => {
					entry['_header'] = `[fltsim.${i}]`;
				});
			}

			// Add to text array
			// Add to text array in sorted order
			if (config.aircraftcfgSortProperties) {
				/**
				 * Fltsim entry properties, sorted
				 */
				let properties: string[] = [
					'title',
					'sim',
					'model',
					'panel',
					'sound',
					'texture',
					'atc_airline',
					'atc_id',
					'ui_createdby',
					'ui_manufacturer',
					'ui_type',
					'ui_variation',
					'atc_parking_codes',
					'atc_parking_types',
					'atc_heavy',
					'prop_anim_ratio',
					'visual_damage',
					'description'
				];

				if (config.aircraftcfgSortUiCreatedbyToBottom) {
					properties = arrayMove(properties, 8, 17);
				}

				fltsimEntries.forEach((entry, i) => {
					const props = [entry._header];
					for (const prop of properties) {
						if (prop in entry) {
							props.push(`${prop}=${entry[prop]}`);
						}
					}

					cleanTextArray = [...cleanTextArray, ...props, ''];
				});
			} else {
			}

			const cleanText = cleanTextArray.join('\n');

			// Apply changes to document
			editor.edit(editBuilder => {
				editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 500), cleanText);
			});
			vscode.window.showInformationMessage('Aicraft.cfg cleaned');
		}
	}
}

/**
 * Renumbers all `[fltsim.X]` entries in the provided text, starting from `0`.
 * @param {string} text - aircraft.cfg file content
 * @return {string} The renumbered file content
 */
function renumberFltsimEntries(text: string): string {
	const regex = /(\[fltsim\..*\])/gi;

	let m;
	let i = 0;
	while ((m = regex.exec(text)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}

		const found = m[0];
		const newEntry = `[fltsim.${i}]`;
		if (found !== newEntry) {
			text = replacePartAtPos(text, m.index, found.length, newEntry);
		}

		i++;
	}

	return text;
}

/**
 * Convert callsigns to uppercase
 * @test https://regex101.com/r/NulI73/2
 * @source [Stackoverflow](https://stackoverflow.com/questions/6142922/replace-a-regex-capture-group-with-uppercase-in-javascript)
 */
function transformCallsignsToUppercase(text: string): string {
	text = text.replace(/(atc_airline=)(.*)/gi, function(fullMatch, g1, g2) {
		return g1 + g2.toUpperCase();
	});
	return text;
}

/**
 * Remove unused fltsim entry lines: https://regex101.com/r/afwh1h/4
 * - atc_id=
 * - atc_id_color=...
 * - atc_flight_number=...
 * - atc_heavy=0
 * - visual_damage=...
 */
function removeUnusedLines(text: string): string {
	text = text.replace(
		/(?:atc_heavy=0\s+)|(?:atc_id=\s+)|(?:atc_id_color=.*\s+)|(?:visual_damage=.*\s+)|(?:atc_flight_number=(?:\d+)?\s+)/gi,
		''
	);
	return text;
}

/**
 * Sort fltsim entry lines: https://regex101.com/r/QbKxF7/3
 *  (0) texture
 *  (1) atc_airline
 *  (2) ui_createdby
 *  (3) ui_manufacturer
 *  (4) ui_variation
 *  (5) ui_type
 *  (6) atc_parking_codes
 *  (7) atc_parking_types
 *  (8) atc_heavy
 *  (9) prop_anim_ratio
 * (10) description
 */
function sortLines(text: string): string {
	// TODO Sort fltsim entry lines
	// regex = /(?<texture>texture=.*\s+)|(?<atc_airline>atc_airline=.*\s+)|(?<ui_createdby>ui_createdby=.*\s+)|(?<ui_manufacturer>ui_manufacturer=.*\s+)|(?<ui_variation>ui_variation=.*\s+)|(?<ui_type>ui_type=.*\s+)|(?<atc_parking_codes>atc_parking_codes=.*\s+)|(?<atc_parking_types>atc_parking_types=.*\s+)|(?<atc_heavy>atc_heavy=.*\s+)|(?<prop_anim_ratio>prop_anim_ratio=.*\s+)|(?<description>description=.*\s+)/gi;
	return text;
}

function createEmptyEntry() {
	let entry: FltsimEntry = {};
	return entry;
}
