import { IContact } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const contacts: ApiModule = [

  {
    method: 'POST',
    path : 'contacts',
    cmnd : async (props) => {
      try {

        const { name, email, phone } = props.event.body as IContact;

        const response = await props.db.query<IContact>(`
          INSERT INTO contacts (name, email, phone)
          VALUES ($1, $2, $3)
          RETURNING id, name, email, phone
        `, [name, email, phone]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'contacts',
    cmnd : async (props) => {
      try {
        const { id, name, email, phone } = props.event.body as IContact;

        if (!id) throw new Error('Must provide contact ID');

        const updateProps = buildUpdate({ id, name, email, phone });

        const response = await props.db.query<IContact>(`
          UPDATE contacts
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name, email, phone
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'contacts',
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IContact>(`
          SELECT * FROM dbview_schema.enabled_contacts
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'contacts/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IContact>(`
          SELECT * FROM dbview_schema.enabled_contacts
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
    path : 'contacts/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IContact>(`
          DELETE FROM contacts
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
    path : 'contacts/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE contacts
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default contacts;