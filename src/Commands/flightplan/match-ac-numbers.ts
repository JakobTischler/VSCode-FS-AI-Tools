import * as vscode from 'vscode';
import { getDropdownSelection } from '../../Tools/input';

enum MatchType {
	Source,
	Target,
}

export async function MatchAcNumbers() {
	/*
	 * Get user selected matchType (current file is source or target?)
	 */
	const matchType = await getDropdownSelection(`Treat this flightplan as source or target?`, ['Source', 'Target']);
	if (!matchType) {
		vscode.window.showErrorMessage(`Match direction canceled.`);
		return false;
	}
	if (!vscode.window.activeTextEditor) {
		vscode.window.showErrorMessage(`Current flightplan TextEditor not found.`);
		return false;
	}
	const thisFile = vscode.window.activeTextEditor.document.uri;
	if (!thisFile) {
		vscode.window.showErrorMessage(`Current flightplan document not found.`);
		return false;
	}

	/*
	 * Get user selected other file
	 */
	const otherFile = await vscode.window.showOpenDialog({
		title: `Select the ${matchType === 'Source' ? 'target' : 'source'} flightplan`,
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		openLabel: 'Select',
		filters: {
			Flightplans: ['txt'],
		},
	});
	if (!otherFile) {
		return false;
	}
	// console.log({ thisFile, otherFile });

	if (thisFile.path.toLowerCase() === otherFile[0].path.toLowerCase()) {
		vscode.window.showErrorMessage(`Source and target flightplans are identical.`);
		return false;
	}

	await match(otherFile[0], MatchType[matchType as keyof typeof MatchType]);
}

async function match(otherFileUri: vscode.Uri, matchType: MatchType) {
	const thisFileContents = vscode.window.activeTextEditor!.document.getText();
	const thisFileColumn = vscode.window.activeTextEditor!.viewColumn;

	const otherFileDocument = await vscode.workspace.openTextDocument(otherFileUri);
	const otherFileContents = otherFileDocument.getText();

	const otherFileEditor = await vscode.window.showTextDocument(otherFileUri, {
		preserveFocus: true,
		viewColumn: (thisFileColumn || 1) + 1,
		preview: false,
	});

	const fileContents = {
		source: thisFileContents,
		target: otherFileContents,
	};
	const fileEditors = {
		// source: vscode.window.activeTextEditor!,
		target: otherFileEditor,
	};
	if (matchType === MatchType.Target) {
		fileContents.source = otherFileContents;
		fileContents.target = thisFileContents;
		// fileEditors.source = otherFileEditor;
		fileEditors.target = vscode.window.activeTextEditor!;
	}

	// console.log({ fileContents, fileEditors });

	// -------------------------------------------------
	const acNumRegex = /^AC#(\d+),(.*?),/gim;

	/*
	 * Map source flightplan's regs to AC#
	 */
	const sourceAircraft = fileContents.source.matchAll(acNumRegex);
	const sourceAircraftAr = [...sourceAircraft];
	if (!sourceAircraftAr.length) {
		vscode.window.showErrorMessage(`No aircraft found in the source flightplan.`);
		return false;
	}
	const sourceRegs = new Map(
		sourceAircraftAr.map((matchAr) => {
			const [, acNum, reg] = matchAr;
			return [reg, acNum];
		})
	);

	// console.log({ sourceRegs });

	// -------------------------------------------------

	/*
	 * Match target aircraft against source regs
	 */
	const targetAircraft = fileContents.target.matchAll(acNumRegex);
	const targetAircraftAr = [...targetAircraft];
	if (!targetAircraftAr.length) {
		vscode.window.showErrorMessage(`No aircraft found in the target flightplan.`);
		return false;
	}
	let updateCount = 0;

	targetAircraftAr.forEach((matchAr) => {
		const [fullMatch, , reg] = matchAr;

		if (sourceRegs.has(reg)) {
			fileContents.target = fileContents.target.replace(fullMatch, `AC#${sourceRegs.get(reg)},${reg},`);
			updateCount++;
		}
	});

	// console.log(fileContents.target);

	// -------------------------------------------------

	/*
	 * Update target document's contents
	 */
	const range = new vscode.Range(0, 0, fileEditors.target.document.lineCount, 9999);
	fileEditors.target.edit((editBuilder) => {
		editBuilder.replace(range, fileContents.target);
	});

	vscode.window.showInformationMessage(
		`${updateCount} regs updated (${targetAircraftAr.length - updateCount} unmatched)`
	);
}
