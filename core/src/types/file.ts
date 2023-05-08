import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
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
  uuid: string;
  name: string;
  mimeType: string;
}

/**
 * @category File
 */
const fileApi = {
  postFileContents: {
    kind: EndpointType.MUTATION,
    url: 'files/content',
    method: 'POST',
    opts: {
      contentType: 'application/octet-stream'
    } as ApiOptions,
    queryArg: new ArrayBuffer(0),
    resultType: { id: '' as string }
  },
  postFile: {
    kind: EndpointType.MUTATION,
    url: 'files',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { uuid: '' as string, name: '' as string, mimeType: '' as string },
    resultType: { id: '' as string, uuid: '' as string, name: '' as string, mimeType: '' as string }
  },
  putFile: {
    kind: EndpointType.MUTATION,
    url: 'files',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: { id: '' as string }
  },
  getFiles: {
    kind: EndpointType.QUERY,
    url: 'files',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IFile[]
  },
  getFileById: {
    kind: EndpointType.QUERY,
    url: 'files/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IFile
  },
  deleteFile: {
    kind: EndpointType.MUTATION,
    url: 'files/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  },
  disableFile: {
    kind: EndpointType.MUTATION,
    url: 'files/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category File
 */
const fileApiHandlers: ApiHandler<typeof fileApi> = {
  postFileContents: async props => {
    const fileId = await props.fs.saveFile(props.event.body, dayjs().add(dayjs.duration(30, 'day')))
    return { id: fileId };
  },
  postFile: async props => {
    const { uuid, name, mimeType: mime_type } = props.event.body;
    const file = await props.tx.one<{ id: string }>(`
      INSERT INTO dbtable_schema.files (uuid, name, mime_type, created_on, created_sub)
      VALUES ($1, $2, $3, $4, $5::uuid)
      RETURNING id
    `, [uuid, name, mime_type, utcNowString(), props.event.userSub]);
    return { id: file.id, uuid };
  },
  putFile: async props => {
    const { id, name } = props.event.body;
    const updateProps = buildUpdate({
      id,
      name,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });
    const file = await props.tx.one(`
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
    await props.tx.none(`
      DELETE FROM dbtable_schema.files
      WHERE id = $1
    `, [id]);
    return { id };
  },
  disableFile: async props => {
    const { id } = props.event.pathParameters;
    await props.tx.none(`
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