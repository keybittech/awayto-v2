import { IContact, utcNowString, buildUpdate, createHandlers } from 'awayto/core';

export default createHandlers({
  postContact: async props => {
    const { name, email, phone } = props.event.body;

    const contact = await props.tx.one<IContact>(`
      INSERT INTO dbtable_schema.contacts (name, email, phone, created_sub)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone
    `, [name, email, phone, props.event.userSub]);

    return contact;
  },
  putContact: async props => {
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

    const contact = await props.tx.one<IContact>(`
      UPDATE dbtable_schema.contacts
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name, email, phone
    `, updateProps.array);

    return contact;
  },
  getContacts: async props => {
    const contacts = await props.db.manyOrNone<IContact>(`
      SELECT * FROM dbview_schema.enabled_contacts
    `);
    return contacts;
  },
  getContactById: async props => {
    const { id } = props.event.pathParameters;
    const contact = await props.db.one<IContact>(`
      SELECT * FROM dbview_schema.enabled_contacts
      WHERE id = $1
    `, [id]);
    return contact;
  },
  deleteContact: async props => {
    const { id } = props.event.pathParameters;
    await props.tx.none(`
      DELETE FROM dbtable_schema.contacts
      WHERE id = $1
    `, [id]);
    return { id };
  },
  disableContact: async props => {
    const { id } = props.event.pathParameters;
    await props.tx.none(`
      UPDATE dbtable_schema.contacts
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);
    return { id };
  },
});