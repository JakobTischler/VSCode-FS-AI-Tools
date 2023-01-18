import * as vscode from 'vscode';
import * as path from 'path';

import {
	getAircraftNumFromLine,
	getFilename,
	getFlightplanFiles,
	replaceDocumentContents,
	showError,
} from '../../Tools/helpers';
import { parseAircraftTxt, TParsedAircraftTxtData } from '../../Content/Aircraft/parseAircraftTxt';
import { AircraftType } from '../../Content/Aircraft/AircraftType';
import { Flightplan } from '../../Content/Flightplan/Flightplan';
import { getNumberInput } from '../../Tools/input';

type TAcTypeGroup = [AircraftType, string[]];

export async function GroupByAircraftType() {
	console.log(`Running GroupByAircaftType()`);

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const filePath = editor.document.uri.path;
	const dirPath = path.dirname(filePath).replace(/^\/+/, '');
	const filename = getFilename(editor).toLowerCase();
	const isFlightplansTxt = filename.startsWith('flightplans');

	// Get Aicraft…, Flightplans… file paths
	const fileData = await getFlightplanFiles(dirPath, true);
	if (!fileData?.aircraft) {
		showError(`Aircraft….txt file couldn't be found in current directory.`, true);
		return;
	}

	const aircraftData: TParsedAircraftTxtData | undefined = await parseAircraftTxt(
		fileData,
		isFlightplansTxt,
		true,
		true
	);
	if (!aircraftData) return;

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 */

	let newFileContents = '';
	let msg = 'Aircraft grouped by type';
	if (isFlightplansTxt) {
		newFileContents = await groupFlightplansTxt(editor.document.getText(), aircraftData);
	} else {
		const { aircraftGroups, unmatchedLines, output } = await groupAircraftTxt(
			editor.document.getText(),
			aircraftData
		);
		newFileContents = output;

		msg = `Aircraft grouped into ${'type'.pluralSimple(aircraftGroups.length)}`;
		if (unmatchedLines.length) {
			msg += ` (${'type'.plural(unmatchedLines.length)} couldn't be matched)`;
		}
	}

	if (newFileContents?.length) {
		// Apply changes to document
		replaceDocumentContents(editor, newFileContents);

		vscode.window.showInformationMessage(msg);
	}
}

async function groupAircraftTxt(
	fileContents: string,
	aircraftData: TParsedAircraftTxtData
): Promise<{
	headerLines: string[];
	aircraftGroups: TAcTypeGroup[];
	aircraftGroupsSorted: TAcTypeGroup[];
	unmatchedLines: string[];
	output: string;
}> {
	const lines = fileContents.split('\n');

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Create header group and aircraft groups
	 */

	const headerLines: string[] = [];
	const unmatchedLines: string[] = [];
	const aircraftGroups: TAcTypeGroup[] = [];
	let currentGroupLines: string[] = [];
	let currentAircraftType: AircraftType | undefined;

	for (const [index, line] of lines.entries()) {
		const acNum = getAircraftNumFromLine(line);
		if (acNum) {
			let acType;
			if (Number.isInteger(acNum)) {
				acType = aircraftData.aircraftLiveries.get(<number>acNum)?.aircraftType;
			} else {
				acType = getAircraftTypeFromLine(line, aircraftData);
			}

			if (!acType) {
				unmatchedLines.push(line);
				showError(`No aircraftType could be matched to "${line}"`, true);
				continue;
			}

			// New aircraftType
			if (acType !== currentAircraftType) {
				// If we already have a currentAircraftType, store to groups array
				if (currentAircraftType) {
					aircraftGroups.push([currentAircraftType, currentGroupLines]);
					currentGroupLines = [];
				}

				currentAircraftType = acType;
			}

			currentGroupLines.push(line);
		} else if (currentAircraftType) {
			currentGroupLines.push(line);
		} else {
			headerLines.push(line);
			continue;
		}

		// Last line: store to groups array
		if (index === lines.length - 1 && currentAircraftType) {
			aircraftGroups.push([currentAircraftType, currentGroupLines]);
		}
	}

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Sort groups by wingspan
	 */
	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);
	const sort = config.get('groupByAircraftType.sortByWingspan');

	let groups = [...aircraftGroups];
	if (sort) {
		groups = groups.sort((a: TAcTypeGroup, b: TAcTypeGroup) => Math.sign(b[0].wingspan! - a[0].wingspan!));
	}

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Create text output
	 */

	/** Only aircraft lines; empty lines removed */
	const cleanedGroups = groups
		.map((group) => {
			return group[1].filter((line) => line.trim().length).join('\n');
		})
		.flat(3);

	const numEmptyLines = Number(
		await getNumberInput(
			config.get('groupByAircraftType.emptyLinesBetweenGroupsAircraftTxt') || '1',
			'Empty lines between groups'
		)
	);

	let output = headerLines.length ? headerLines.join('\n') + '\n' : '';
	output += cleanedGroups.join('\n' + '\n'.repeat(numEmptyLines));
	output += unmatchedLines.length ? `\n\n\n\n//Unmatched aircraft\n${unmatchedLines.join('\n')}` : '';
	console.log({ headerLines, aircraftGroups, aircraftGroupsSorted: groups, unmatchedLines, output });

	return { headerLines, aircraftGroups, aircraftGroupsSorted: groups, unmatchedLines, output };
}

function getAircraftTypeFromLine(
	text: string,
	aircraftData: TParsedAircraftTxtData,
	allowInactive = true,
	allowInvalidNumber = true
) {
	const regex = new RegExp(
		`^(?:AC${allowInactive ? '|//)' : ')'}#(?<acNum>` +
			(allowInvalidNumber ? '.*?)' : '\\d+?)') +
			',\\d+,\\"(?<title>.*)\\"'
	);
	const match = text.match(regex);
	console.log({ text, match });

	if (match?.groups?.title) {
		const matchingLiveries = [
			...aircraftData.inactiveAircraftLiveries,
			...aircraftData.aircraftLiveries.values(),
		].filter((livery) => {
			return livery.title === match!.groups!.title;
		});

		if (matchingLiveries.length) {
			return matchingLiveries[0].aircraftType;
		}
	}
}

async function groupFlightplansTxt(fileContents: string, aircraftData: TParsedAircraftTxtData) {
	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Parse flightplan to get all aircraft matched to aircraft types and
	 * liveries
	 */

	// Parse flightplan
	const flightplan = new Flightplan(fileContents);
	flightplan.parse(aircraftData.aircraftTypes, aircraftData.aircraftLiveries, false);
	// console.log({ flightplan });
	// console.log({ aircraftData });

	/*
	 * —————————————————————————————————————————————————————————————————————————
	 * Sort by wingspan
	 */
	const config = vscode.workspace.getConfiguration('fs-ai-tools', undefined);
	const sort = config.get('groupByAircraftType.sortByWingspan');

	let aircraftTypeGroups = [...aircraftData.aircraftTypes.values()];
	if (sort) {
		aircraftTypeGroups = aircraftTypeGroups.sort((a: AircraftType, b: AircraftType) =>
			Math.sign(b.wingspan! - a.wingspan!)
		);
	}

	const appendWingspan = config.get('groupByAircraftType.addWingspanToGroupHeadline');
	const FEET_TO_METERS = 0.3048;
	const appendCount = config.get('groupByAircraftType.addCountToGroupHeadline') as boolean;

	const textGroups = aircraftTypeGroups
		.filter((aircraftType) => aircraftType.aircraftCount > 0)
		.map((aircraftType) => {
			// Main header line
			let header = `//${aircraftType.name}`;
			if (appendWingspan === 'Imperial') {
				header += ` (${aircraftType.wingspan.toLocaleString('en-US', {
					style: 'unit',
					unit: 'foot',
					minimumFractionDigits: 1,
					maximumFractionDigits: 2,
				})})`;
			} else if (appendWingspan === 'Metric') {
				header += ` (${(aircraftType.wingspan * FEET_TO_METERS).toLocaleString('en-US', {
					style: 'unit',
					unit: 'meter',
					minimumFractionDigits: 1,
					maximumFractionDigits: 2,
				})})`;
			}

			if (appendCount) {
				header += ` [${aircraftType.aircraftCount}]`;
			}

			const content = [...aircraftType.liveries].map((livery) => {
				if (livery.hasValidNum) {
					const content = livery.aircraft.map((aircraft) => aircraft.text);

					// If this livery has a variation part, add a header line at the beginning
					const header = livery.variationHeader;
					if (header) {
						content.unshift(header);
					}

					return content.join('\n').trimEnd();
				}
			});

			return [header, ...content].join('\n').trimEnd();
		});

	const numEmptyLines = Number(
		await getNumberInput(
			config.get('groupByAircraftType.emptyLinesBetweenGroupsFlightplansTxt') || '1',
			'Empty lines between groups'
		)
	);

	// TODO find main header lines (before first AC)
	// let output = headerLines.length ? headerLines.join('\n') + '\n' : '';
	const output = textGroups.join('\n' + '\n'.repeat(numEmptyLines)) + '\n';

	console.log({ textGroups, output });
	return output;
}
