import { IUuidNotes } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const uuidNotes: ApiModule = [

  {
    method: 'POST',
    path : 'uuid_notes',
    cmnd : async (props) => {
      try {
        const { parentUuid: parent_uuid, note } = props.event.body as IUuidNotes;

        const response = await props.db.query<IUuidNotes>(`
          INSERT INTO uuid_notes (parent_uuid, note, created_on, created_sub)
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
    method: 'PUT',
    path : 'uuid_notes',
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, note } = props.event.body as IUuidNotes;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, parent_uuid, note, updated_on: (new Date()).toString(), updated_sub: props.event.userSub });

        await props.db.query(`
          UPDATE uuid_notes
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
    method: 'GET',
    path : 'uuid_notes',
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
    method: 'GET',
    path : 'uuid_notes/:id',
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
    method: 'DELETE',
    path : 'uuid_notes/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUuidNotes>(`
          DELETE FROM uuid_notes
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'uuid_notes/disable',
    cmnd : async (props) => {
      try {
        const notes = props.event.body as IUuidNotes[];

        await asyncForEach(notes, async note => {
          await props.db.query(`
            UPDATE uuid_notes
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