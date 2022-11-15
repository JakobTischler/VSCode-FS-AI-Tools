import * as vscode from 'vscode';
import { getDropdownSelection } from '../../Tools/input';

enum ReplaceType {
	Source,
	Target,
}

export async function ReplaceAircraftInTargetFp() {
	/*
	 * Get user selected replaceType (current file is source or target?)
	 */
	const replaceType = await getDropdownSelection(`Treat this flightplan as source or target?`, ['Source', 'Target']);
	if (!replaceType) {
		vscode.window.showErrorMessage(`Replace direction canceled.`);
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
		title: `Select the ${replaceType === 'Source' ? 'target' : 'source'} flightplan`,
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

	await replace(otherFile[0], ReplaceType[replaceType as keyof typeof ReplaceType]);
}

async function replace(otherFileUri: vscode.Uri, replaceType: ReplaceType) {
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
	if (replaceType === ReplaceType.Target) {
		fileContents.source = otherFileContents;
		fileContents.target = thisFileContents;
		// fileEditors.source = otherFileEditor;
		fileEditors.target = vscode.window.activeTextEditor!;
	}

	// console.log({ fileContents, fileEditors });

	// -------------------------------------------------
	const acRegex = /^AC#(\d+),(.*?),.*$/gim;

	/*
	 * Map source flightplan's regs to line
	 */
	const sourceAircraft = [...fileContents.source.matchAll(acRegex)];
	if (!sourceAircraft.length) {
		vscode.window.showErrorMessage(`No aircraft found in the source flightplan.`);
		return false;
	}
	const sourceRegs = new Map(
		sourceAircraft.map((matchAr) => {
			const [fullMatch, , reg] = matchAr;
			return [reg, fullMatch];
		})
	);

	// console.log({ sourceRegs });

	// -------------------------------------------------

	/*
	 * Match target aircraft against source regs
	 */
	const targetAircraft = [...fileContents.target.matchAll(acRegex)];
	if (!targetAircraft.length) {
		vscode.window.showErrorMessage(`No aircraft found in the target flightplan.`);
		return false;
	}
	let updateCount = 0;

	targetAircraft.forEach((matchAr) => {
		const [fullMatch, , reg] = matchAr;

		if (sourceRegs.has(reg)) {
			fileContents.target = fileContents.target.replace(fullMatch, sourceRegs.get(reg)!);
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
		`${updateCount} regs updated (${targetAircraft.length - updateCount} unmatched)`
	);
}
