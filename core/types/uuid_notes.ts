import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IUuidNotesState> {}
}

/**
 * @category Uuid Notes
 */
export type IUuidNotes = {
  id: string;
  parentUuid: string;
  note: string;
}

/**
 * @category Uuid Notes
 */
export type IUuidNotesState = IUuidNotes & {
  notes: Record<string, IUuidNotes>;
};

/**
 * @category Action Types
 */
export enum IUuidNotesActionTypes {
  POST_UUID_NOTES = "POST/uuid_notes",
  PUT_UUID_NOTES = "PUT/uuid_notes",
  GET_UUID_NOTES = "GET/uuid_notes",
  GET_UUID_NOTES_BY_ID = "GET/uuid_notes/:id",
  DELETE_UUID_NOTES = "DELETE/uuid_notes/:id",
  DISABLE_UUID_NOTES = "PUT/uuid_notes/disable"
}