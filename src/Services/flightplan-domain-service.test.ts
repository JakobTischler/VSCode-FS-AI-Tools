import assert from 'node:assert/strict';
import { convertHourlyFlightplanLine, convertHourlyFlightplansToWeek, getHeaderDefaults, renderFlightplanHeader, serializeAifpCfg } from './flightplan-domain-service';

describe('flightplan domain service', () => {
	it('converts hourly schedules into seven-day weekly schedules', () => {
		const result = convertHourlyFlightplanLine('AC#1,N1,50%,24HR,IFR,08:00,@10:00,100,F,12,EDDF', '24HR');
		assert.ok(result?.includes('0/08:00,@0/10:00,100,F,12,EDDF'));
		assert.ok(result?.includes('6/08:00,@6/10:00,100,F,12,EDDF'));
	});
	it('preserves unsupported and malformed lines', () => {
		const input = '// heading\nAC#1,N1,50%,WEEK,IFR\nAC#2,N2,50%,1HR,IFR,bad';
		assert.deepEqual(convertHourlyFlightplansToWeek(input), { text: input, converted: 0 });
	});
	it('derives filename defaults', () => assert.deepEqual(getHeaderDefaults('Flightplans_BAW_British Airways.txt'), { icao: 'BAW', airline: 'British Airways' }));
	it('renders optional header values', () => {
		const template = '//{fsx}\n//{airline? | }{icao? | }"{callsign}"';
		assert.equal(renderFlightplanHeader(template, { airline: 'Example', icao: 'EXA', callsign: 'example', fsx: true }), '//FSXDAYS=TRUE\n//Example | EXA | "EXAMPLE"');
	});
	it('serializes aifp data', () => assert.ok(serializeAifpCfg({ found: true, airline: 'Example', fsx: false }).includes('FS_Version=FS9')));
});
