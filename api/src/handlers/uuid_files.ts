import { ApiHandlers, IUuidFiles, buildUpdate, utcNowString } from 'awayto/core';

export default {
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
} as Pick<
  ApiHandlers,
  'postUuidFile' |
  'putUuidFile' |
  'getUuidFiles' |
  'getUuidFileById' |
  'deleteUuidFile' |
  'disableUuidFile'
>;