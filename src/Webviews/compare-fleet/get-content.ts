// import * as vscode from 'vscode';
import path from 'path';
import { IFleetCompareResultData } from '../../Commands/flightplan/compare-fleet';

export async function getWebviewContent(data: IFleetCompareResultData) {
	const thisFilename = path.parse(data.files.thisFile.path).base;
	const otherFilename = path.parse(data.files.otherFile.path).base;

	// ------------------------------------------------------------------

	let content = `<!DOCTYPE html>
<html lang="en">`;
	// content += getHeadContent(uris.css);

	content += `<body>`;

	// content += await getHeaderContent(panel, aifp, flightplanDirPath);

	content += `<main>
	<header>
		<h1>Fleet Comparal</h1>
		<h2><div class="fileName">${thisFilename}</div> vs. <div class="fileName">${otherFilename}</div>
	</header>`;

	content += `
		<table>
			<thead>
				<th>Type</th>
				<th>${thisFilename}</th>
				<th>${otherFilename}</th>
				<th>Diff</th>
			</thead>
			<tbody>`;

	for (const row of data.compareData) {
		content += `
			<tr>
				<td>${row.typeCode}</td>
				<td>${row.thisCount}</td>
				<td>${row.otherCount}</td>
				<td>${formatDeltaText(row.thisCount - row.otherCount)}</td>
			</tr>`;
	}

	content += `
		<tfoot>
			<tr>
				<td>Total</td>
				<td>${data.total.thisFleet}</td>
				<td>${data.total.otherFleet}</td>
				<td>${formatDeltaText(data.total.thisFleet - data.total.otherFleet)}</td>
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
