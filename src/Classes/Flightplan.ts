import { showError } from '../Tools/helpers';
import { TAirportCodeCount } from './Airport';

export class Flightplan {
	constructor(flightplanText: string) {}
}

export class FlightplanRaw {
	text: string;

	constructor(flightplanText: string) {
		this.text = flightplanText;
	}

	collectAirportCodes() {
		const matches = [...this.text.trim().matchAll(/,[FfRr],\d+,([A-Za-z0-9]{3,4})/gm)];
		if (!matches?.length) {
			showError('No airports could be found in the flightplan.');
			return null;
		}

		const data: { [icao: string]: TAirportCodeCount } = {};
		for (const match of matches) {
			const icao = match[1];

			if (data[icao]) {
				data[icao].count = data[icao].count! + 1;
			} else {
				data[icao] = { icao, count: 0 };
			}
		}

		return new Set(
			Object.values(data).sort((a: TAirportCodeCount, b: TAirportCodeCount) => {
				// Sort ascending
				if (a.icao < b.icao) return -1;
				if (a.icao > b.icao) return 1;
				return 0;
			})
		);
	}
}
