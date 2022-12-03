import * as fs from 'fs';
import * as path from 'path';
import trash from 'trash';

import { Selection, window } from 'vscode';
import { listStringItems, showError } from '../../Tools/helpers';

export async function DeleteAircraftFromAircraftCfg() {
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
				dirs.push(match[1]);
			}
		}
		data.set(selection, dirs);
	}

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
		for (const textureDir of textureDirs) {
			const dir = path.resolve(document.fileName, '..', `texture.${textureDir}\\`);

			// Check if texture directory exists
			if (!fs.existsSync(dir)) {
				showError(`Directory "${dir}" doesn't seem to exist.`);
				continue;
			}

			// Delete directory
			await fs.promises.rm(dir, { recursive: true, force: true });
			// await trash(dir);
			console.log(`🗑 Directory "${dir}" removed`);
		}

		/* Delete selected text */
		editor.edit((builder) => {
			builder.replace(selection, '');
		});
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
