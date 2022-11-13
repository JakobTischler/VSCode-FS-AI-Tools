/**
 * @source https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/nodeDependencies.ts
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getFlightplanFiles } from '../../Tools/helpers';

export class FlightplansAircraftProvider implements vscode.TreeDataProvider<AircraftNum> {
	/*
	 * Change Events
	 */
	private _onDidChangeTreeData: vscode.EventEmitter<AircraftNum | undefined | void> = new vscode.EventEmitter<
		AircraftNum | undefined | void
	>();
	readonly onDidChangeTreeData: vscode.Event<AircraftNum | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AircraftNum): vscode.TreeItem {
		return element;
	}

	getChildren(element?: AircraftNum): Thenable<AircraftNum[]> {
		/*
		 * Get current active file's path
		 */
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('No active file');
		}

		const resource = editor.document.uri;

		let filePath;
		if (resource.scheme === 'file') {
			const fileName = path.basename(resource.fsPath);

			if (fileName.toLowerCase().startsWith('flightplans')) {
				filePath = resource.fsPath;
			}
		}
		if (!filePath) {
			// throw new Error(`Active thing open isn't a flightplans file`);
		} else {
			if (element) {
				// TODO get current active file's file path
				return Promise.resolve(this.getAircraftNums(filePath));
			} else {
				// TODO get current active file's file path
				return Promise.resolve(this.getAircraftNums(filePath));
			}
		}

		return Promise.resolve([]);
	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	private async getAircraftNums(filePath: string): Promise<AircraftNum[]> {
		if (this.pathExists(filePath)) {
			const dirPath = path.dirname(filePath);
			const filesData = await getFlightplanFiles(dirPath, true);

			const aircraftContents = filesData.aircraft.text;
			const flightplanContents = filesData.flightplans.text;

			if (!aircraftContents?.length || !flightplanContents?.length) {
				// TODO error message
				return [];
			}

			const aircraftTxtMatches = [...aircraftContents.matchAll(/AC#(\d+),\d+,\"(.*?)\"/gi)];
			const flightplansTxtMatches = [...aircraftContents.matchAll(/AC#(\d+)/gi)];

			if (flightplansTxtMatches?.length) {
				// Parse aircraftTxtMatches
				let aircraft = new Map();
				if (aircraftTxtMatches?.length) {
					aircraft = new Map(
						aircraftTxtMatches.map((match): [number, string] => {
							return [Number(match[1]), match[2]];
						})
					);
				}

				// Flightplans.txt: remove duplicates, sort ascending
				const numsSet = new Set(flightplansTxtMatches.map((match) => Number(match[1])));
				const n = [...numsSet].sort();

				return n.map((num) => {
					const title = aircraft.get(num) || '';

					return new AircraftNum(`AC#${num}`, title, vscode.TreeItemCollapsibleState.None);
				});
			}
		}

		return [];
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}
		return true;
	}
}

class AircraftNum extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private readonly title: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = this.label;
		this.description = this.title;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'AircraftNum.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'AircraftNum.svg'),
	};

	contextValue = 'aircraftNum';
}
