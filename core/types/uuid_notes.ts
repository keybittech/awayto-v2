import { Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

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
const uuidNotesApi = {
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

/**
 * @category Uuid Notes
 */
const uuidNotesApiHandlers: ApiHandler<typeof uuidNotesApi> = {
  postUuidNote: async props => {
    const { parentUuid: parent_uuid, note } = props.event.body;

    const { id } = await props.tx.one<IUuidNotes>(`
      INSERT INTO dbtable_schema.uuid_notes (parent_uuid, note, created_on, created_sub)
      VALUES ($1, $2, $3, $4::uuid)
      ON CONFLICT (parent_uuid, note, created_sub) DO NOTHING
      RETURNING id
    `, [parent_uuid, note, utcNowString(), props.event.userSub]);
    
    return { id };
  },
  putUuidNote: async props => {
    const { id, parentUuid: parent_uuid, note } = props.event.body;

    const updateProps = buildUpdate({
      id,
      parent_uuid,
      note,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.uuid_notes
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { id };
  },
  getUuidNotes: async props => {
    const uuidNotes = await props.db.manyOrNone<IUuidNotes>(`
      SELECT * FROM dbview_schema.enabled_uuid_notes
    `);
    
    return uuidNotes;
  },
  getUuidNoteById: async props => {
    const { id } = props.event.pathParameters;

    const uuidNote = await props.db.one<IUuidNotes>(`
      SELECT * FROM dbview_schema.enabled_uuid_notes
      WHERE id = $1
    `, [id]);
    
    return uuidNote;
  },
  deleteUuidNote: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.uuid_notes
      WHERE id = $1
    `, [id]);
    
    return { id };
  }
} as const;

/**
 * @category Uuid Notes
 */
type UuidNotesApi = typeof uuidNotesApi;

/**
 * @category Uuid Notes
 */
type UuidNotesApiHandler = typeof uuidNotesApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<UuidNotesApi> { }
  interface SiteApiHandlerRef extends Extend<UuidNotesApiHandler> { }
}

Object.assign(siteApiRef, uuidNotesApi);
Object.assign(siteApiHandlerRef, uuidNotesApiHandlers);