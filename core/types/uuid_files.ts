import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IUuidFilesState> {}
}
/**
 * @category Uuid Files
 */
export type IUuidFiles = {
  id: string;
  parentUuid: string;
  fileId: string;
}

/**
 * @category Uuid Files
 */
export type IUuidFilesState = IUuidFiles & {
  uuidFiles: Record<string, IUuidFiles>;
};

/**
 * @category Action Types
 */
export enum IUuidFilesActionTypes {
  POST_UUID_FILES = "POST/uuid_files",
  PUT_UUID_FILES = "PUT/uuid_files",
  GET_UUID_FILES = "GET/uuid_files",
  GET_UUID_FILES_BY_ID = "GET/uuid_files/:id",
  DELETE_UUID_FILES = "DELETE/uuid_files/:id",
  DISABLE_UUID_FILES = "PUT/uuid_files/disable"
}