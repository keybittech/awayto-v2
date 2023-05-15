import { IForm, buildUpdate, createHandlers, utcNowString } from 'awayto/core';

export default createHandlers({
  postForm: async props => {
    const form = props.event.body;
    const { id: formId } = await props.tx.one<{ id: string }>(`
      INSERT INTO dbtable_schema.forms (name, created_on, created_sub)
      VALUES ($1, $2, $3::uuid)
      RETURNING id
    `, [form.name, utcNowString(), props.event.userSub]);

    return { ...form, id: formId };
  },
  postFormVersion: async props => {
    const { version, name } = props.event.body;
    const { formId } = props.event.pathParameters;
    const { id: versionId } = await props.tx.one<{ id: string }>(`
      INSERT INTO dbtable_schema.form_versions (form_id, form, created_on, created_sub)
      VALUES ($1::uuid, $2::jsonb, $3, $4::uuid)
      RETURNING id
    `, [formId, version.form, utcNowString(), props.event.userSub]);

    const updateProps = buildUpdate({
      id: formId,
      name,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.forms
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    version.id = versionId;
    version.formId = formId;

    return version;
  },
  putForm: async props => {
    const { id, name } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.forms
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { id };
  },
  getForms: async props => {
    const form = await props.db.manyOrNone<IForm>(`
      SELECT * FROM dbview_schema.enabled_forms
    `);
    return form;
  },

  getFormById: async props => {
    const { id } = props.event.pathParameters;
    const form = await props.db.one<IForm>(`
      SELECT * FROM dbview_schema.enabled_forms
      WHERE id = $1
    `, [id]);

    return form;
  },
  deleteForm: async props => {
    try {
      const { id } = props.event.pathParameters;
      await props.tx.none(`
        DELETE FROM dbtable_schema.forms
        WHERE id = $1
      `, [id]);

      return { id };

    } catch (error) {
      throw error;
    }
  },
  disableForm: async props => {
    try {
      const { id } = props.event.pathParameters;

      await props.tx.none(`
        UPDATE dbtable_schema.forms
        SET enabled = false, updated_on = $2, updated_sub = $3
        WHERE id = $1
      `, [id, utcNowString(), props.event.userSub]);

      return { id };
    } catch (error) {
      throw error;
    }
  }
});