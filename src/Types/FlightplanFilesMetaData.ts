export interface IFileMetaData {
	fileName: string;
	filePath: string;
	text?: string;
}

type fileNames = 'aircraft' | 'airports' | 'flightplans';

export type TFlightplanFilesMetaData = Record<fileNames, IFileMetaData>;
