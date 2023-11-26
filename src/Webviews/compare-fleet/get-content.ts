import * as vscode from 'vscode';
import path from 'path';
import { IFleetCompareResultData } from '../../Commands/flightplan/compare-fleet';

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
	content += getHeadContent(css);

	content += `<body>`;

	// content += await getHeaderContent(panel, aifp, flightplanDirPath);

	content += `<header>
		<h1>Fleet Comparal</h1>
		<div class="subHeader">
			<div class="fileName">${thisFilename}</div> vs. <div class="fileName">${otherFilename}</div>
		</div>
	</header>`;

	content += `<main>`;

	// Table head
	content += `
		<table id="compare">
			<thead>
				<th>Type</th>
				<th>${thisFilename}</th>
				<th>${otherFilename}</th>
				<th>Diff</th>
			</thead>
			<tbody>`;

	// Rows
	for (const row of data.compareData) {
		const delta = row.thisCount - row.otherCount;
		content += `
			<tr>
				<td>${row.typeCode}</td>
				<td class="${row.thisCount == 0 ? 'none' : ''}">${row.thisCount}</td>
				<td class="${row.otherCount == 0 ? 'none' : ''}">${row.otherCount}</td>
				<td class="${getDeltaCellClass(delta)}">${formatDeltaText(delta)}</td>
			</tr>`;
	}

	// Total
	const totalDelta = data.total.thisFleet - data.total.otherFleet;
	content += `
		<tfoot>
			<tr>
				<td>Total</td>
				<td>${data.total.thisFleet}</td>
				<td>${data.total.otherFleet}</td>
				<td class="${getDeltaCellClass(totalDelta)}">${formatDeltaText(totalDelta)}</td>
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
	if (num > 0) {
		return `+${num}`;
	}

	if (num < 0) {
		return `-${Math.abs(num)}`;
	}

	return '=';
};

const getDeltaCellClass = (num: number) => {
	if (num > 0) {
		return 'pos';
	}
	if (num < 0) {
		return 'neg';
	}
	return 'equal';
};

function getHeadContent(customCssUri: vscode.Uri) {
	return `<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Compare Fleets</title>

	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;500&family=Montserrat:wght@300;500&family=Noto+Serif+Display:ital,wght@0,300;0,600;1,300&display=swap" rel="stylesheet">

	<link rel="stylesheet" type="text/css" href="${customCssUri}" />
</head>`;
}
