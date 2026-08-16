import assert from 'node:assert/strict';
import {
	changeComments,
	changeAircraftNumbers,
	countAircraftGroups,
	formatTimes,
	padFlightLevels,
	padFlightNumbers,
	randomizePercentage,
	transformToUppercase,
	switchSimulatorDays,
	rebaseAircraftNumbers,
} from './flightplan-transformations';

describe('flightplan transformations', () => {
	it('removes seconds and adds the arrival marker', () => {
		assert.equal(formatTimes('1/08:15:30,TNG2/09:45:59', true, true), '1/08:15,@TNG2/09:45');
	});

	it('preserves seconds and an existing arrival marker', () => {
		assert.equal(formatTimes('08:15:30,@09:45:59', false, true), '08:15:30,@09:45:59');
	});

	it('replaces percentages deterministically when min equals max', () => {
		assert.equal(randomizePercentage('AC#1,N123,42%,WEEK,IFR', 75, 75), 'AC#1,N123,75%,WEEK,IFR');
	});

	it('uppercases flightplan content', () => {
		assert.equal(transformToUppercase('ac#1,ifr,eddf'), 'AC#1,IFR,EDDF');
	});

	it('pads flight numbers without changing the flight rule', () => {
		assert.equal(padFlightNumbers(',F,7,EDDF ,r,12345,EGLL'), ',F,0007,EDDF ,r,12345,EGLL');
	});

	it('pads flight levels to three digits', () => {
		assert.equal(padFlightLevels(',70,F, ,120,R,'), ',070,F, ,120,R,');
	});

	it('normalizes comment spacing while preserving indentation', () => {
		assert.equal(changeComments('  //   comment', 1), '  // comment');
		assert.equal(changeComments('  //   comment', 0), '  //comment');
	});

	it('keeps the FSXDAYS directive unspaced', () => {
		assert.equal(changeComments('// FSXDAYS=TRUE', 1), '//FSXDAYS=TRUE');
	});

	it('changes active and inactive aircraft numbers by a signed amount', () => {
		assert.equal(changeAircraftNumbers('AC#10,title\n//#20,title', -5), 'AC#5,title\n//#15,title');
	});

	it('converts and wraps FS9/FSX day numbers for weekly plans', () => {
		const fs9 = 'AC#1,N1,1%,WEEK,IFR,6/08:00,@0/09:00,100,F,1,EDDF';
		const fsx = switchSimulatorDays(fs9, false);
		assert.equal(fsx.text, 'AC#1,N1,1%,WEEK,IFR,5/08:00,@6/09:00,100,F,1,EDDF');
		assert.equal(fsx.changed, 1);
		assert.equal(switchSimulatorDays(fsx.text, true).text, fs9);
	});

	it('leaves comments and unsupported periods unchanged during simulator conversion', () => {
		const input = '// comment\nAC#1,N1,1%,24HR,IFR,0/08:00,@0/09:00,100,F,1,EDDF';
		assert.deepEqual(switchSimulatorDays(input, false), { text: input, changed: 0 });
	});

	it('rebases aircraft entries and advances to the next group boundary', () => {
		const input = 'AC#9,one\nAC#20,two\n\nAC#30,three';
		assert.equal(
			rebaseAircraftNumbers(input, { start: 100, groupStep: 10, itemStep: 1, emptyLinesBetweenGroups: 1, kind: 'aircraft' }),
			'AC#100,one\nAC#101,two\n\nAC#110,three'
		);
	});

	it('keeps repeated flightplan AC numbers together when rebasing', () => {
		const input = 'AC#9,first\nAC#9,second\nAC#20,third';
		assert.equal(
			rebaseAircraftNumbers(input, { start: 50, groupStep: 10, itemStep: 2, emptyLinesBetweenGroups: 2, kind: 'flightplans' }),
			'AC#50,first\nAC#50,second\nAC#52,third'
		);
	});

	it('writes and replaces aircraft group counts', () => {
		const input = '// Airbus [99]\nAC#1,a\nAC#2,b\n\n// Boeing\nAC#3,c';
		assert.deepEqual(countAircraftGroups(input), {
			text: '// Airbus [2]\nAC#1,a\nAC#2,b\n\n// Boeing [1]\nAC#3,c',
			total: 3,
			groups: 2,
		});
	});
});
