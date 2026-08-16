import assert from 'node:assert/strict';
import { planFlightplanFileRenames, shortenSeason } from './rename-domain-service';

describe('rename domain service', () => {
	it('plans only recognized flightplan files', () => {
		assert.deepEqual(planFlightplanFileRenames(['Aircraft_old.txt', 'Airports_old.txt', 'notes.txt'], '_BAW.txt', true), [
			{ source: 'Aircraft_old.txt', target: 'Aircraft_BAW.txt' },
			{ source: 'Airports_old.txt', target: 'Airports_BAW.txt' },
		]);
	});
	it('omits no-op renames', () => assert.deepEqual(planFlightplanFileRenames(['aircraft_BAW.txt'], '_BAW.txt', false), []));
	it('shortens long and two-year seasons', () => {
		assert.equal(shortenSeason('Summer 2025'), 'Su25');
		assert.equal(shortenSeason('Winter 2025-2026'), 'Wi2526');
	});
});
