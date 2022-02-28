import { Aircraft } from './Aircraft';
import { AircraftType } from './AircraftType';

export class AircraftLivery {
	acType: AircraftType;
	title: string;
	aircraft?: Aircraft[];

	constructor(title: string) {
		this.title = title;
		this.acType = this.titleToAircraftType();

		this.acType.liveries.push(this);
	}

	titleToAircraftType() {
		// TODO
		// parse
		// if exists in some array → use
		// else create new
		return new AircraftType('asdf');
	}
}
