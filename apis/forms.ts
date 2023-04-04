import { v4 as uuid } from 'uuid';

import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { IForm, IFormActionTypes, utcNowString } from 'awayto/core';

const forms: ApiModule = [

  {
    action: IFormActionTypes.POST_FORM,
    cmnd : async (props) => {
      try {
        const form = props.event.body;

        const { rows: [{ id: formId }]} = await props.db.query<{ id: string }>(`
          INSERT INTO dbtable_schema.forms (name, created_on, created_sub)
          VALUES ($1, $2, $3::uuid)
          RETURNING id
        `, [form.name, utcNowString(), props.event.userSub]);
        
        form.id = formId;

        return [form];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IFormActionTypes.POST_FORM_VERSION,
    cmnd : async (props) => {
      try {
        const { version } = props.event.body;
        const { formId } = props.event.pathParameters;

        const { rows: [{ id: versionId }]} = await props.db.query<{ id: string }>(`
          INSERT INTO dbtable_schema.form_versions (form_id, form, created_on, created_sub)
          VALUES ($1::uuid, $2::jsonb, $3, $4::uuid)
          RETURNING id
        `, [formId, version.form, utcNowString(), props.event.userSub]);

        const updateProps = buildUpdate({
          id: formId,
          updated_on: utcNowString(),
          updated_sub: props.event.userSub
        });

        await props.db.query(`
          UPDATE dbtable_schema.forms
          SET ${updateProps.string}
          WHERE id = $1
        `, updateProps.array);

        version.id = versionId;
        version.formId = formId;

        return [version];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFormActionTypes.PUT_FORM,
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({
          id,
          name,
          updated_on: utcNowString(),
          updated_sub: props.event.userSub
        });

        await props.db.query(`
          UPDATE dbtable_schema.forms
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
    action: IFormActionTypes.GET_FORMS,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IForm>(`
          SELECT * FROM dbview_schema.enabled_forms
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFormActionTypes.GET_FORM_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IForm>(`
          SELECT * FROM dbview_schema.enabled_forms
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFormActionTypes.DELETE_FORM,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IForm>(`
          DELETE FROM dbtable_schema.forms
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IFormActionTypes.DISABLE_FORM,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.forms
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default forms;