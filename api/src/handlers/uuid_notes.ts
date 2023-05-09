import { ApiHandlers, IUuidNotes, buildUpdate, utcNowString } from 'awayto/core';

export default {
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
} as Pick<
  ApiHandlers,
  'postUuidNote' |
  'putUuidNote' |
  'getUuidNotes' |
  'getUuidNoteById' |
  'deleteUuidNote'
>;