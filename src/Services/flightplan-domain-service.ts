import '../Extenders/number';
import type { AifpData } from '../Tools/read-aifp';

export type HourlyPeriod = '1HR' | '2HR' | '4HR' | '8HR' | '12HR' | '24HR';
const hours: Record<HourlyPeriod, number> = { '1HR': 1, '2HR': 2, '4HR': 4, '8HR': 8, '12HR': 12, '24HR': 24 };

export function convertHourlyFlightplansToWeek(text: string): { text: string; converted: number } {
	let converted = 0;
	const lines = text.trim().split('\n').map((line) => {
		const period = line.split(',')[3]?.toUpperCase() as HourlyPeriod;
		if ((!line.toLowerCase().startsWith('ac#') && !line.startsWith('//#')) || !(period in hours)) return line;
		const result = convertHourlyFlightplanLine(line, period);
		if (!result) return line;
		converted++;
		return result;
	});
	return { text: lines.join('\n'), converted };
}

export function convertHourlyFlightplanLine(line: string, period: HourlyPeriod): string | undefined {
	const fields = line.split(',');
	const pattern = /,(?<dh>\d+):(?<dm>\d+(?::\d+)?),(?<marker>@|TNG)?(?<ah>\d+):(?<am>\d+(?::\d+)?),(?<rest>\d+,[FR],\d+,\w+)/gi;
	const matches = [...line.matchAll(pattern)];
	if (!matches.length) return undefined;
	const legs: Array<{ dep: string; arr: string; marker: string; rest: string; overnight: boolean }> = [];
	for (let repeat = 0; repeat < 24 / hours[period]; repeat++) {
		for (const match of matches) {
			const g = match.groups!;
			const dh = (Number(g.dh) + hours[period] * repeat) % 24;
			const ah = (Number(g.ah) + hours[period] * repeat) % 24;
			legs.push({ dep: `${dh.pad(2)}:${g.dm}`, arr: `${ah.pad(2)}:${g.am}`, marker: g.marker || '', rest: g.rest, overnight: ah + Number(g.am.split(':')[0]) / 60 <= dh + Number(g.dm.split(':')[0]) / 60 });
		}
	}
	const output = [...fields.slice(0, 3), 'WEEK', fields[4]];
	for (let day = 0; day < 7; day++) for (const leg of legs) output.push(`${day}/${leg.dep},${leg.marker}${day + Number(leg.overnight)}/${leg.arr},${leg.rest}`);
	return output.join(',');
}

export function getHeaderDefaults(filename: string) {
	const parts = filename.split('_');
	if (parts.length === 3 && parts[1].length <= 4) return { icao: parts[1], airline: parts[2].replace(/\.[^.]+$/, '') };
	if (parts.length === 2) return { icao: 'ICAO', airline: parts[1].replace(/\.[^.]+$/, '') };
	return { icao: 'ICAO', airline: 'Airline Name' };
}

export function renderFlightplanHeader(template: string, data: Partial<AifpData>): string {
	return template.replace(/\{(\w+)(?:\?([^}]*))?\}/g, (_match, key: keyof AifpData, suffix?: string) => {
		let value: string | boolean | undefined = data[key];
		if (key === 'fsx' && typeof value === 'boolean') value = `FSXDAYS=${value ? 'TRUE' : 'FALSE'}`;
		if (key === 'callsign' && typeof value === 'string') value = value.toUpperCase();
		return value === undefined || value === '' ? '' : `${value}${suffix ?? ''}`;
	});
}

export function serializeAifpCfg(data: AifpData): string {
	return `[main]\nAIRLINE=${data.airline || ''}\nAIRLINE_ICAO=${data.icao || ''}\nCALLSIGN=${data.callsign || ''}\nSEASON=${data.season || ''}\nSEEK=atc_airline=${data.callsign || ''}\nPROVIDER=${data.author || ''}\nFS_Version=${data.fsx ? 'FSX' : 'FS9'}\n`;
}
