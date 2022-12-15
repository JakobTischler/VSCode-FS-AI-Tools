export interface AircraftData {
	list: string[];
	series: { [manufacturer: string]: string[] };
	types: {
		[manufacturer: string]: {
			search: string[];
			/**
			 * Example:
			 *
			 * ```
			 * "Pilatus": {
			 * 	"search": ["Pilatus"],
			 * 	"types": {
			 * 		"PC12": {
			 * 			"name": "PC-12",
			 * 			"search": ["PC12", "PC-12"],
			 * 			"wingspan": 53.41666667
			 * 		}
			 * 	}
			 * }
			 * ```
			 */
			types: {
				[typeName: string]: {
					/** Formatted type name */
					name: string;
					/** All possible search terms */
					search: string[];
					/** Optional series id */
					series?: string;
					/** Wingspan in feet. Defaults to 50 */
					wingspan?: number;
				};
			};
		};
	};
}
