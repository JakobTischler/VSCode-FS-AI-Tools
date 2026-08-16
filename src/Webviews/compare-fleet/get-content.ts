import * as vscode from 'vscode';
import path from 'path';
import { IFleetCompareResultData } from '../../Commands/flightplan/compare-fleet';
import { escapeHtml } from '../../Utils/webview';

export async function getWebviewContent(
	panel: vscode.WebviewPanel,
	context: vscode.ExtensionContext,
	data: IFleetCompareResultData
) {
	const thisFilename = path.parse(data.files.thisFile.path).base;
	const otherFilename = path.parse(data.files.otherFile.path).base;

	// CSS
	const css = panel.webview.asWebviewUri(
		vscode.Uri.file(path.join(context.extensionPath, 'res', 'Webviews', 'compare-fleet', 'style.css'))
	);

	// ------------------------------------------------------------------

	let content = `<!DOCTYPE html>
<html lang="en">`;
	content += getHeadContent(panel.webview, css);

	content += `<body>`;

	// content += await getHeaderContent(panel, aifp, flightplanDirPath);

	content += `<header>
		<h1>Fleet Comparal</h1>
		<div class="subHeader">
			<span class="fileName">${escapeHtml(thisFilename)}</span> <span class="vs">vs.</span> <span class="fileName">${escapeHtml(otherFilename)}</span>
		</div>
	</header>`;

	content += `<main>`;

	// Table head
	content += `
		<table id="compare">
			<thead>
				<th class="align-right">${escapeHtml(thisFilename)}</th>
				<th class="align-right">Diff</th>
				<th class="align-center">Type</th>
				<th>${escapeHtml(otherFilename)}</th>
			</thead>
			<tbody>`;

	// Rows
	for (const row of data.compareData) {
		const delta = row.thisCount - row.otherCount;
		content += `
			<tr>
				<td class="count ${row.thisCount == 0 ? 'none' : ''} align-right">${row.thisCount}</td>
				<td class="delta ${getDeltaCellClass(delta)} align-right">${formatDeltaText(delta)}</td>
				<td class="type align-center">${escapeHtml(row.typeCode)}</td>
				<td class="count ${row.otherCount == 0 ? 'none' : ''}">${row.otherCount}</td>
			</tr>`;
	}

	// Total
	const totalDelta = data.total.thisFleet - data.total.otherFleet;
	content += `
		<tfoot>
			<tr>
				<td class="count align-right">${data.total.thisFleet}</td>
				<td class="delta ${getDeltaCellClass(totalDelta)} align-right">${formatDeltaText(totalDelta)}</td>
				<td class="type align-center">Total</td>
				<td class="count">${data.total.otherFleet}</td>
			</tr>
		</tfoot>`;

	content += `</tbody>`;

	content += '</main>';

	// content += getScriptsContent(uris.js);

	content += `</body>
			</html>`;

	return content;
}

/**
 * The function `formatDeltaText` takes a number as input and returns the number
 * prefixed with its sign, or an equal sign if it's 0.
 * @param {number} num - The parameter `num` is a number that represents the
 * difference or delta value.
 * @returns The number prefixed with its sign, or an equal sign if it's 0.
 *
 * Example:
 * * 5 → "+5"
 * * -31 → "-31"
 * * 0 → "="
 */
const formatDeltaText = (num: number): string => {
	return [String(num), '=', `+${num}`][Math.sign(num) + 1];
};

const getDeltaCellClass = (num: number) => {
	return ['neg', 'equal', 'pos'][Math.sign(num) + 1];
};

const getHeadContent = (webview: vscode.Webview, cssUri: vscode.Uri) => `
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource};">
	<title>Compare Fleets</title>

	<link rel="stylesheet" type="text/css" href="${cssUri}" />
</head>`;
