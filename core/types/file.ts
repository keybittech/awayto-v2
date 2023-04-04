import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IFileState> {}
}

/**
 * @category File
 */
export interface IPreviewFile extends File {
  preview?: string;
}

/**
 * @category File
 */
export type IFileType = {
  id: string;
  name: string;
}

/**
 * @category File
 */
export type IFile = {
  id: string;
  fileTypeId: string;
  fileTypeName: string;
  name: string;
  location: string;
}

/**
 * @category File
 */
export type IFileState = IFile & {
  files: Record<string, IFile>
};

/**
 * @category Action Types
 */
export enum IFileActionTypes {
  POST_FILE = "POST/files",
  PUT_FILE = "PUT/files",
  GET_FILES = "GET/files",
  GET_FILE_BY_ID = "GET/files/:id",
  DELETE_FILE = "PUT/files/delete",
  DISABLE_FILE = "PUT/files/disable"
}