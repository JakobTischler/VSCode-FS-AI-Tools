import * as vscode from 'vscode';
import { replacePartAtPos } from '../../helpers';

export async function CleanAircraftCfg() {
	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if (
			'file' === document.uri.scheme &&
			document.uri.path.toLocaleLowerCase().endsWith('aircraft.cfg')
		) {
			let text = document.getText();

			if (config.aircraftcfgRenumber) {
				text = renumberFltsimEntries(text);
			}

			if (config.aircraftcfgRemoveUnusedLines) {
				text = removeUnusedLines(text);
			}

			if (config.aircraftcfgTrimEmptyLines) {
				text = trimEmptyLines(text);
			}

			if (config.aircraftcfgCallsignsUppercase) {
				text = transformCallsignsToUppercase(text);
			}

			// TODO
			// if (config.sortLines) {
			// 	text = sortLines(text);
			// }

			// Apply changes to document
			editor.edit(editBuilder => {
				editBuilder.replace(new vscode.Range(0, 0, document.lineCount, 500), text);
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
 * Trim empty lines after fltsim section
 * @test https://regex101.com/r/lYpV7F/4
 */
function trimEmptyLines(text: string): string {
	const regex = /(\[fltsim\.\d+\][\n|\r])([\s\S]+?)([\n|\r]{3,})/gim; //TODO: [\n|\r] could be replaced with \s+
	text = text.replace(regex, '$1$2\n\n');
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
