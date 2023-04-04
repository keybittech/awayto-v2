import { v4 as uuid } from 'uuid';
import { Extend, Void } from '../util';
import { ApiHandler, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

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
const fileApi = {
  postFile: {
    kind: EndpointType.MUTATION,
    url: 'files',
    method: 'POST',
    cache: true,
    queryArg: { name: '' as string, fileTypeId: '' as string, location: '' as string },
    resultType: { id: '' as string, newUuid: '' as string }
  },
  putFile: {
    kind: EndpointType.MUTATION,
    url: 'files',
    method: 'PUT',
    cache: true,
    queryArg: { id: '' as string, name: '' as string, fileTypeId: '' as string, location: '' as string },
    resultType: { id: '' as string }
  },
  getFiles: {
    kind: EndpointType.QUERY,
    url: 'files',
    method: 'GET',
    cache: true,
    queryArg: {} as Void,
    resultType: [] as IFile[]
  },
  getFileById: {
    kind: EndpointType.QUERY,
    url: 'files/:id',
    method: 'GET',
    cache: true,
    queryArg: { id: '' as string },
    resultType: {} as IFile
  },
  deleteFile: {
    kind: EndpointType.MUTATION,
    url: 'files/:id',
    method: 'DELETE',
    cache: true,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  },
  disableFile: {
    kind: EndpointType.MUTATION,
    url: 'files/:id/disable',
    method: 'PUT',
    cache: true,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category File
 */
const fileApiHandlers: ApiHandler<typeof fileApi> = {
  postFile: async props => {
    const newUuid = uuid();
    const { name, fileTypeId: file_type_id, location } = props.event.body;
    const file = await props.db.one<{ id: string }>(`
      INSERT INTO dbtable_schema.files (uuid, name, file_type_id, location, created_on, created_sub)
      VALUES ($1, $2, $3, $4, $5, $6::uuid)
      RETURNING id
    `, [newUuid, name, file_type_id, location, utcNowString(), props.event.userSub]);
    return { id: file.id, newUuid };
  },
  putFile: async props => {
    const { id, name, fileTypeId: file_type_id, location } = props.event.body;
    const updateProps = buildUpdate({
      id,
      name,
      file_type_id,
      location,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });
    const file = await props.db.one(`
      UPDATE dbtable_schema.files
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);
    return file;
  },
  getFiles: async props => {
    const files = await props.db.manyOrNone<IFile>(`
      SELECT * FROM dbview_schema.enabled_files
    `);
    return files;
  },
  getFileById: async props => {
    const { id } = props.event.pathParameters;
    const file = await props.db.one<IFile>(`
      SELECT * FROM dbview_schema.enabled_files
      WHERE id = $1
      `, [id]);

    return file;
  },
  deleteFile: async props => {
    const { id } = props.event.pathParameters;
    await props.db.none(`
      DELETE FROM dbtable_schema.files
      WHERE id = $1
    `, [id]);
    return { id };
  },
  disableFile: async props => {
    const { id } = props.event.pathParameters;
    await props.db.none(`
      UPDATE dbtable_schema.files
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);
    return { id };
  },
} as const;

/**
 * @category File
 */
type FileApi = typeof fileApi;

/**
 * @category File
 */
type FileApiHandler = typeof fileApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<FileApi> { }
  interface SiteApiHandlerRef extends Extend<FileApiHandler> { }
}

Object.assign(siteApiRef, fileApi);
Object.assign(siteApiHandlerRef, fileApiHandlers);