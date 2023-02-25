import { IContact, IContactActionTypes, utcNowString } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const contacts: ApiModule = [

  {
    action: IContactActionTypes.POST_CONTACT,
    cmnd : async (props) => {
      try {

        const { name, email, phone } = props.event.body;

        const response = await props.db.query<IContact>(`
          INSERT INTO dbtable_schema.contacts (name, email, phone, created_sub)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, email, phone
        `, [name, email, phone, props.event.userSub]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IContactActionTypes.PUT_CONTACT,
    cmnd : async (props) => {
      try {
        const { id, name, email, phone } = props.event.body;

        if (!id) throw new Error('Must provide contact ID');

        const updateProps = buildUpdate({
          id,
          name,
          email,
          phone,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<IContact>(`
          UPDATE dbtable_schema.contacts
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
    action: IContactActionTypes.GET_CONTACTS,
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
    action: IContactActionTypes.GET_CONTACT_BY_ID,
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
    action: IContactActionTypes.DELETE_CONTACT,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IContact>(`
          DELETE FROM dbtable_schema.contacts
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IContactActionTypes.DISABLE_CONTACT,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.contacts
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default contacts;