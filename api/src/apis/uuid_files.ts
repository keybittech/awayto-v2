import { IUuidFiles, IUuidFilesActionTypes } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const uuidFiles: ApiModule = [

  {
    action: IUuidFilesActionTypes.POST_UUID_FILES,
    cmnd : async (props) => {
      try {
        const { parentUuid: parent_uuid, fileId: file_id } = props.event.body as IUuidFiles;

        const response = await props.db.query<IUuidFiles>(`
          INSERT INTO uuid_files (parent_uuid, file_id, created_on, created_sub)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (parent_uuid, file_id) DO NOTHING
          RETURNING id
        `, [parent_uuid, file_id, new Date(), props.event.userSub]);
        
        return { id: response.rows[0].id };

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IUuidFilesActionTypes.PUT_UUID_FILES,
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body as IUuidFiles;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, parent_uuid, file_id, updated_on: (new Date()).toString(), updated_sub: props.event.userSub });

        await props.db.query(`
          UPDATE uuid_files
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
    action: IUuidFilesActionTypes.GET_UUID_FILES,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IUuidFiles>(`
          SELECT * FROM dbview_schema.enabled_uuid_files
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidFilesActionTypes.GET_UUID_FILES_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUuidFiles>(`
          SELECT * FROM dbview_schema.enabled_uuid_files
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidFilesActionTypes.DELETE_UUID_FILES,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUuidFiles>(`
          DELETE FROM uuid_files
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUuidFilesActionTypes.DISABLE_UUID_FILES,
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body as IUuidFiles;

        await props.db.query(`
          UPDATE uuid_files
          SET enabled = false
          WHERE parent_uuid = $1 AND file_id = $2
        `, [parent_uuid, file_id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default uuidFiles;