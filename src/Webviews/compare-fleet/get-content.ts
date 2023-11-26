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

	content += '<main>';

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
		const delta = row.thisCount - row.otherCount;
		let deltaText = '=';
		if (delta > 0) {
			deltaText = `+${delta}`;
		} else if (delta < 0) {
			deltaText = `-${delta}`;
		}

		content += `
			<tr>
				<td>${row.typeCode}</td>
				<td>${row.thisCount}</td>
				<td>${row.otherCount}</td>
				<td>${deltaText}</td>
			</tr>`;
	}

	content += `</tbody>`;

	content += '</main>';

	// content += getScriptsContent(uris.js);

	content += `</body>
			</html>`;

	return content;
}
