import { Aircraft } from './Aircraft';
import { AircraftType } from './AircraftType';

/** A map of `AircraftLivery` entries, where the key is its respective AC# */
export type TAircraftLiveriesByAcNum = Map<number | string, AircraftLivery>;

export class AircraftLivery {
	/** The livery's title as used in the aircraft.txt file. */
	title: string;
	/** Contains all variation parts extracted from the title */
	variation: string[];
	/** The livery's AC#. */
	num: number | string;
	/** Defines if the AC# is a regular number. (e.g.: 123 → true, "1XX" → false) */
	hasValidNum: boolean;
	/** The optional manual aircraft count as used by `countAircraftSimple()`. */
	manualCount?: number;
	/** The list of aircraft using this livery. Filled by `parseFlightplan()`. */
	aircraft: Aircraft[] = [];
	/** The aircraftType that this livery belongs to. */
	aircraftType?: AircraftType;

	private static variationRegex =
		/^(.*?)(?<var1> - (?<var1val1>.*?)| \((?<var1val2>.*?)\))?(?<var2> - (?<var2val1>.*?)| \((?<var2val2>.*?)\))?(?<var3> - (?<var3val1>.*?)| \((?<var3val2>.*?)\))?(?<var4> - (?<var4val1>.*?)| \((?<var4val2>.*?)\))?(?<var5> - (?<var5val1>.*?)| \((?<var5val2>.*?)\))?$/m;
	private static variationRegexGroupNames = [
		'var1val1',
		'var1val2',
		'var2val1',
		'var2val2',
		'var3val1',
		'var3val2',
		'var4val1',
		'var4val2',
		'var5val1',
		'var5val2',
	];

	constructor(num: number | string, title: string) {
		this.num = num;
		this.hasValidNum = Number.isInteger(Number(num));
		this.title = title;
		this.variation = this.getVariation(title);
		// this.acType = this.titleToAircraftType();

		// this.acType.liveries.push(this);
	}

	titleToAircraftType() {
		// TODO
		// parse
		// if exists in some array → use
		// else create new
		return new AircraftType('asdf');
	}

	/** Uses regex to extract variation descriptors from the title, looking in
	 * parantheses or after hyphens. */
	getVariation(text: string): string[] {
		const variationParts = [];
		const match = text.match(AircraftLivery.variationRegex);
		if (match?.length && match.length > 1 && match?.groups) {
			// const baseTitle = match[1];

			for (const groupName of AircraftLivery.variationRegexGroupNames) {
				if (match.groups[groupName]?.length) {
					const clean = match.groups[groupName].replace(/(^ ?- ?|^ ?\(|\)$)/g, '');
					variationParts.push(clean);
				}
			}
		}

		return variationParts;
	}

	get variationHeader(): string | undefined {
		if (this.variation.length) {
			return `\t//${this.variation.join(', ')}`;
		}

		return undefined;
	}

	/**
	 * Returns the aircraft count, using either the length of the `aircraft`
	 * array, or the `manualCount` value as fallback.
	 */
	get count() {
		return this.manualCount || this.aircraft.length;
	}
}
