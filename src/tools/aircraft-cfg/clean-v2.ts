import * as vscode from 'vscode';
import { replacePartAtPos, arrayMove } from '../../helpers';
// import { create } from 'domain';

type FltsimEntry = { [key: string]: string };

export async function CleanAircraftCfg() {
	console.log('CleanAircraftCfg() v2');

	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const document = editor.document;

	if ('file' !== document.uri.scheme || !document.uri.path.toLocaleLowerCase().endsWith('aircraft.cfg')) return;

	// Start
	const text = document.getText();
	const splitText = text.split('\n');

	/**
	 * The final lines array.
	 */
	const cleanTextArray: string[] = [];

	/**
	 * The current cfg sub-section in the line iteration.
	 */
	let currentSection: string | null = null;
	let isFltsimSection = false;

	/**
	 * The current fltsim entry's data.
	 */
	let currentFltsimEntry = createEmptyEntry();

	/**
	 * List of all entries, with each entry being an object
	 */
	const fltsimEntries: FltsimEntry[] = [];

	const removeProperties = new Map(
		config.cleanAircraftCfg.removeUnusedLinesItems.map((prop: string) => prop.split('='))
	);

	// Split lines and iterate through
	for (let [i, line] of splitText.entries()) {
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
					if (config.cleanAircraftCfg.removeUnusedLines && removeProperties.has(key)) {
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

					if (add) {
						// Callsign uppercase
						if (config.cleanAircraftCfg.callsignsUppercase && key === 'atc_airline') {
							value = value.toUpperCase();
						}

						// Add to fltsim entry
						currentFltsimEntry[key] = value;
					}
				}
			} else {
				cleanTextArray.push(line);
			}
		} else if (currentSection && isFltsimSection) {
			//ignore line
		} else {
			cleanTextArray.push(line);
		}

		// Last line, push entry to list if necessary
		if (i === splitText.length - 1 && currentSection && isFltsimSection) {
			fltsimEntries.push(currentFltsimEntry);
		}
	}

	// Renumber
	if (config.cleanAircraftCfg.renumber) {
		fltsimEntries.forEach((entry, i) => {
			entry['_header'] = `[fltsim.${i}]`;
		});
	}

	// Add to text array in sorted order
	if (config.cleanAircraftCfg.sortProperties) {
		for (const entry of fltsimEntries) {
			const props = [entry._header];
			delete entry._header;

			// First the sort keys...
			props.push(
				...config.cleanAircraftCfg.sortPropertiesOrder
					.filter((key: string) => key in entry)
					.map((key: string) => {
						const ret = `${key}=${entry[key]}`;
						delete entry[key];
						return ret;
					})
			);

			// ... then the remaining ones
			props.push(...Object.keys(entry).map((key) => `${key}=${entry[key]}`));

			cleanTextArray.push(...props, '');
		}
	} else {
		// Add to text array in original order
		for (const entry of fltsimEntries) {
			cleanTextArray.push(
				...Object.entries(entry).map(([key, value]) => (key === '_header' ? value : `${key}=${value}`)),
				''
			);
		}
	}

	// Apply changes to document
	editor.edit((editBuilder) => {
		editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 500), cleanTextArray.join('\n'));
	});
	vscode.window.showInformationMessage('Aicraft.cfg cleaned');
}

function createEmptyEntry() {
	return <FltsimEntry>{};
}
