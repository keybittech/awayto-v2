import { ApiHandlers, IGroupFiles, buildUpdate, utcNowString } from 'awayto/core';

export default {
  postGroupFile: async props => {
    const { groupId: group_id, fileId: file_id } = props.event.body;

    const { id } = await props.tx.one<IGroupFiles>(`
      INSERT INTO dbtable_schema.group_files (group_id, file_id, created_on, created_sub)
      VALUES ($1, $2, $3, $4::uuid)
      RETURNING id
    `, [group_id, file_id, utcNowString(), props.event.userSub]);
    
    return { id };
  },
  putGroupFile: async props => {
    const { id, groupId: group_id, fileId: file_id } = props.event.body;

    const updateProps = buildUpdate({
      id,
      group_id,
      file_id,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.group_files
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { id };
  },
  getGroupFiles: async props => {
    const groupFiles = await props.db.manyOrNone<IGroupFiles>(`
      SELECT * FROM dbview_schema.enabled_group_files
      WHERE "groupId" = $1
    `);
    
    return groupFiles;
  },
  getGroupFileById: async props => {
    const { groupId, id } = props.event.pathParameters;

    const response = await props.db.one<IGroupFiles>(`
      SELECT * FROM dbview_schema.enabled_group_files
      WHERE "groupId" = $1 AND id = $2
    `, [groupId, id]);
    
    return response;
  },
  deleteGroupFile: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.group_files
      WHERE id = $1
    `, [id]);
    
    return { id };
  },
} as Pick<
  ApiHandlers,
  'postGroupFile' |
  'putGroupFile' |
  'getGroupFiles' |
  'getGroupFileById' |
  'deleteGroupFile'
>;