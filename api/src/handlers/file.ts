import dayjs from 'dayjs';
import { ApiHandlers, IFile, buildUpdate, utcNowString } from 'awayto/core';

export default {
  postFileContents: async props => {
    const id = await props.fs.saveFile(props.event.body);
    return { id };
  },
  putFileContents: async props => {
    const { id, name, mimeType } = props.event.body;
    const expiration = dayjs().add(dayjs.duration(30, 'day'));

    await props.fs.putFile({ id, name, mimeType, expiration });
    return { success: true };
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
} as Pick<
  ApiHandlers,
  'postFileContents' |
  'putFileContents' |
  'postFile' |
  'putFile' |
  'getFiles' |
  'getFileById' |
  'deleteFile' |
  'disableFile'
>;