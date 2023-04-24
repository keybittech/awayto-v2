import { Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

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
const uuidFilesApi = {
  postUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { parentUuid: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  },
  putUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, parentUuid: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  },
  getUuidFiles: {
    kind: EndpointType.QUERY,
    url: 'uuid_files',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IUuidFiles[]
  },
  getUuidFileById: {
    kind: EndpointType.QUERY,
    url: 'uuid_files/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUuidFiles
  },
  deleteUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUuidFiles
  },
  disableUuidFile: {
    kind: EndpointType.MUTATION,
    url: 'uuid_files/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, parentUuid: '' as string, fileId: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Uuid Files
 */
const uuidFilesApiHandlers: ApiHandler<typeof uuidFilesApi> = {
  postUuidFile: async props => {
    const { parentUuid: parent_uuid, fileId: file_id } = props.event.body;

    const { id } = await props.tx.one<IUuidFiles>(`
      INSERT INTO dbtable_schema.uuid_files (parent_uuid, file_id, created_on, created_sub)
      VALUES ($1, $2, $3, $4::uuid)
      RETURNING id
    `, [parent_uuid, file_id, utcNowString(), props.event.userSub]);
    
    return { id };
  },
  putUuidFile: async props => {
    const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body;

    const updateProps = buildUpdate({
      id,
      parent_uuid,
      file_id,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.uuid_files
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { id };
  },
  getUuidFiles: async props => {
    const uuidFiles = await props.db.manyOrNone<IUuidFiles>(`
      SELECT * FROM dbview_schema.enabled_uuid_files
    `);
    
    return uuidFiles;
  },
  getUuidFileById: async props => {
    const { id } = props.event.pathParameters;

    const response = await props.db.one<IUuidFiles>(`
      SELECT * FROM dbview_schema.enabled_uuid_files
      WHERE id = $1
    `, [id]);
    
    return response;
  },
  deleteUuidFile: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.uuid_files
      WHERE id = $1
    `, [id]);
    
    return { id };
  },
  disableUuidFile: async props => {
    const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body;

    await props.tx.none(`
      UPDATE dbtable_schema.uuid_files
      SET enabled = false, updated_on = $3, updated_sub = $4
      WHERE parent_uuid = $1 AND file_id = $2
    `, [parent_uuid, file_id, utcNowString(), props.event.userSub]);

    return { id };
  },
} as const;

/**
 * @category Uuid Files
 */
type UuidFilesApi = typeof uuidFilesApi;

/**
 * @category Uuid Files
 */
type UuidFilesApiHandler = typeof uuidFilesApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<UuidFilesApi> { }
  interface SiteApiHandlerRef extends Extend<UuidFilesApiHandler> { }
}

Object.assign(siteApiRef, uuidFilesApi);
Object.assign(siteApiHandlerRef, uuidFilesApiHandlers);