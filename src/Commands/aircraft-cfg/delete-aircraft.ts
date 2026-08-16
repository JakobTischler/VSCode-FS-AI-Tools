import * as fs from 'fs';
import * as path from 'path';

import { Selection, window } from 'vscode';
import { listStringItems, showError } from '../../Tools/helpers';
import { moveDirectoryToTrash, resolveTextureDirectory } from '../../Utils/texture-directory';

export async function DeleteAircraftFromAircraftCfg(): Promise<false | undefined> {
	console.log('DeleteAircraftFromAircraftCfg()');

	const editor = window.activeTextEditor;
	const document = editor?.document;
	if (!editor || !document || !['file', 'untitled'].includes(document.uri.scheme)) {
		return false;
	}

	const selections = editor.selections;
	if (!selections) {
		showError(`No text selected`);
		return false;
	}

	/*
	 * Get texture value from selections
	 */
	const data: Map<Selection, string[]> = new Map();
	for (const selection of [...selections]) {
		const text = document.getText(selection);
		const matches = [...text.matchAll(/texture\s*=\s*(.*)$/gim)];

		console.log(matches);

		const dirs: string[] = [];

		if (matches) {
			for (const match of matches) {
				if (match[1].trim()) dirs.push(match[1]);
			}
		}
		data.set(selection, dirs);
	}

	const aircraftRoot = path.dirname(document.fileName);
	let deletionPlan: Map<Selection, string[]>;
	try {
		deletionPlan = new Map(
			[...data].map(([selection, textures]) => [
				selection,
				textures.map((texture) => resolveTextureDirectory(aircraftRoot, texture).path),
			])
		);
	} catch (error) {
		showError(`Deletion cancelled: ${String(error)}`, true);
		return false;
	}

	const affectedDirectories = [...new Set([...deletionPlan.values()].flat())].filter((item) => fs.existsSync(item));
	const preview = [
		`Modify: ${document.fileName}`,
		`${data.size} selected ${data.size === 1 ? 'range' : 'ranges'}`,
		...affectedDirectories.map((item) => `Move to Recycle Bin: ${item}`),
	].join('\n');
	const previewChoice = await window.showWarningMessage('Deletion preview', { modal: true, detail: preview }, 'Continue');
	if (previewChoice !== 'Continue') return false;

	/*
	 * Confirm and delete texture folder, then delete selection
	 */
	for (const [selection, textureDirs] of data) {
		const dirsInQuotes = textureDirs.map((item) => `"${item}"`);
		const dirsList = listStringItems(...dirsInQuotes);

		/* Confirm deletion */
		const msg = `Are you sure you want to delete ${dirsList} as well as the corresponding selected text?`;
		const button = `Delete aircraft`;

		let continueDeletion = true;
		await window.showWarningMessage(`Confirm deletion`, { modal: true, detail: msg }, button).then((buttonText) => {
			if (buttonText) {
				console.log(`✔️ Deletion confirmed for ${dirsList}`);
			} else {
				continueDeletion = false;
			}
		});

		if (!continueDeletion) {
			showError(`❌ Deletion canceled for ${dirsList}.`);
			continue;
		}

		/* Iterate through matched texture params and delete directories */
		for (const dir of deletionPlan.get(selection) ?? []) {
			// Check if texture directory exists
			if (!fs.existsSync(dir)) {
				showError(`Directory "${dir}" doesn't seem to exist.`);
				continue;
			}

			// Delete directory
			await moveDirectoryToTrash(dir);
			console.log(`🗑 Directory "${dir}" moved to the Recycle Bin`);
		}

		/* Delete selected text */
		const editApplied = await editor.edit((builder) => {
			builder.replace(selection, '');
		});
		if (!editApplied) throw new Error(`VS Code could not update "${document.fileName}".`);
	}

	// TODO Renumber
	/*
	 * Renumber [fltsim.x]
	 */
	/* let fltsimIndex = -1;
	fileContents = fileContents.replaceAll(/\[fltsim\..*?\]/gim, () => {
		fltsimIndex++;
		return `[fltsim.${fltsimIndex}]`;
	}); */

	console.log(`-----------------------------
### Deletion process complete`);
}
