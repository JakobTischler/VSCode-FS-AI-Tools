export interface IFileMetaData {
	fileName: string;
	filePath: string;
	text?: string;
}

export const flightplanFileNames = ['aircraft', 'airports', 'flightplans'] as const;
type TFlightplanFileName = (typeof flightplanFileNames)[number];

export type TFlightplanFilesMetaData = Record<TFlightplanFileName, IFileMetaData>;
