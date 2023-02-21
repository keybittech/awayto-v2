import { IUuidNotes, IUuidNotesActionTypes } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const uuidNotes: ApiModule = [

  {
    action: IUuidNotesActionTypes.POST_UUID_NOTES,
    cmnd : async (props) => {
      try {
        const { parentUuid: parent_uuid, note } = props.event.body;

        const response = await props.db.query<IUuidNotes>(`
          INSERT INTO dbtable_schema.uuid_notes (parent_uuid, note, created_on, created_sub)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (parent_uuid, note, created_sub) DO NOTHING
          RETURNING id
        `, [parent_uuid, note, new Date(), props.event.userSub]);
        
        return { id: response.rows[0].id };

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IUuidNotesActionTypes.PUT_UUID_NOTES,
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, note } = props.event.body;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, parent_uuid, note, updated_on: (new Date()).toString(), updated_sub: props.event.userSub });

        await props.db.query(`
          UPDATE dbtable_schema.uuid_notes
          SET ${updateProps.string}
          WHERE id = $1
        `, updateProps.array);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidNotesActionTypes.GET_UUID_NOTES,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IUuidNotes>(`
          SELECT * FROM dbview_schema.enabled_uuid_notes
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidNotesActionTypes.GET_UUID_NOTES_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUuidNotes>(`
          SELECT * FROM dbview_schema.enabled_uuid_notes
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidNotesActionTypes.DELETE_UUID_NOTES,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUuidNotes>(`
          DELETE FROM dbtable_schema.uuid_notes
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidNotesActionTypes.DISABLE_UUID_NOTES,
    cmnd : async (props) => {
      try {
        const { notes } = props.event.body;

        await asyncForEach(Object.values(notes), async note => {
          await props.db.query(`
            UPDATE dbtable_schema.uuid_notes
            SET enabled = false
            WHERE id = $1
          `, [note.id]);
        });

        return notes;
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default uuidNotes;