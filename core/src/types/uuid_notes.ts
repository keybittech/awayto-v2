import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Uuid Notes
 */
export type IUuidNotes = {
  id: string;
  parentUuid: string;
  note: string;
}

/**
 * @category UuidNotes
 */
export default {
  postUuidNote: {
    kind: EndpointType.MUTATION,
    url: 'uuid_notes',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { parentUuid: '' as string, note: '' as string },
    resultType: { id: '' as string }
  },
  putUuidNote: {
    kind: EndpointType.MUTATION,
    url: 'uuid_notes',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, parentUuid: '' as string, note: '' as string },
    resultType: { id: '' as string }
  },
  getUuidNotes: {
    kind: EndpointType.QUERY,
    url: 'uuid_notes',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IUuidNotes[]
  },
  getUuidNoteById: {
    kind: EndpointType.QUERY,
    url: 'uuid_notes/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUuidNotes
  },
  deleteUuidNote: {
    kind: EndpointType.MUTATION,
    url: 'uuid_notes/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUuidNotes
  }
} as const;