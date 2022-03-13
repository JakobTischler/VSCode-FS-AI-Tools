import { Flightplan } from '../Flightplan/Flightplan';

export class Routemap {
	flightplan: Flightplan;

	constructor(flightplan: Flightplan) {
		this.flightplan = flightplan;
	}
}
