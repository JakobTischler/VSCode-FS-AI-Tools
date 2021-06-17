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
		if ('file' === document.uri.scheme && document.uri.path.toLocaleLowerCase().endsWith('aircraft.cfg')) {
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

			const removeProperties = new Map();
			for (const prop of config.cleanAircraftCfg.removeUnusedLinesItems) {
				let [key, value] = prop.split('=');
				removeProperties.set(key, value);
			}

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
							if (config.cleanAircraftCfg.removeUnusedLines) {
								if (removeProperties.has(key)) {
									let removeValue = removeProperties.get(key);
									if (removeValue === undefined) {
										add = false;
									} else if (removeValue === '*' && value) {
										add = false;
									} else if (removeValue === '_' && !value) {
										add = false;
									} else if (removeValue === value) {
										add = false;
									}
								}
							}

							// Callsign uppercase
							if (config.cleanAircraftCfg.callsignsUppercase && key === 'atc_airline') {
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
			if (config.cleanAircraftCfg.renumber) {
				fltsimEntries.forEach((entry, i) => {
					entry['_header'] = `[fltsim.${i}]`;
				});
			}

			// Add to text array in sorted order
			if (config.cleanAircraftCfg.sortProperties) {
				let sortProperties: string[] = config.cleanAircraftCfg.sortPropertiesOrder.split('>').map((item: string) => item.trim());

				fltsimEntries.forEach((entry, i) => {
					const props = [entry._header];
					delete entry._header;

					// First the sort keys...
					for (const key of sortProperties) {
						if (key in entry) {
							props.push(`${key}=${entry[key]}`);
							delete entry[key];
						}
					}

					// ... then the remaining ones
					for (const prop in entry) {
						props.push(`${prop}=${entry[prop]}`);
					}

					cleanTextArray = [...cleanTextArray, ...props, ''];
				});
			} else {
			}

			const cleanText = cleanTextArray.join('\n');

			// Apply changes to document
			editor.edit((editBuilder) => {
				editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 500), cleanText);
			});
			vscode.window.showInformationMessage('Aicraft.cfg cleaned');
		}
	}
}

function createEmptyEntry() {
	let entry: FltsimEntry = {};
	return entry;
}
