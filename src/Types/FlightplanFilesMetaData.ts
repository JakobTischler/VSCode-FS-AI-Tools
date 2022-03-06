export interface IFileMetaData {
	fileName: string;
	filePath: string;
	text?: string;
}

export type TFlightplanFilesMetaData = {
	aircraft: IFileMetaData;
	airports: IFileMetaData;
	flightplans: IFileMetaData;
};
