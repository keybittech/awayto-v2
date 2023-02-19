import { v4 as uuidV4 } from 'uuid';

import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { IFile } from 'awayto';

const files: ApiModule = [

  {
    method: 'POST',
    path : 'files',
    cmnd : async (props) => {
      try {
        const uuid = uuidV4();
        const { name, fileTypeId: file_type_id, location } = props.event.body as IFile;

        const response = await props.db.query<{ id: string }>(`
          INSERT INTO files (uuid, name, file_type_id, location, created_on, created_sub)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [uuid, name, file_type_id, location, new Date(), props.event.userSub]);
        
        return { id: response.rows[0].id, uuid };

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'files',
    cmnd : async (props) => {
      try {
        const { id, name, fileTypeId: file_type_id, location } = props.event.body as Required<IFile>;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, name, file_type_id, location, updated_on: (new Date()).toString(), updated_sub: props.event.userSub });

        await props.db.query(`
          UPDATE files
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
    path : 'files',
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IFile>(`
          SELECT * FROM dbview_schema.enabled_files
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'files/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IFile>(`
          SELECT * FROM dbview_schema.enabled_files
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
    path : 'files/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IFile>(`
          DELETE FROM files
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
    path : 'files/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE files
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default files;