import { AircraftLivery } from './AircraftLivery';

export class AircraftType {
	title: string;
	liveries: AircraftLivery[] = [];

	constructor(title: string) {
		this.title = title;
	}
}
