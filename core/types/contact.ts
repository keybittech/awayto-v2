import { Extend, Merge, Void } from '../util';
import { ApiHandler, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

declare global {
  interface IMergedState extends Merge<IContactState> { }
}

/**
 * @category Contact
 */
export type IContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

/**
 * @category Contact
 */
export type IContactState = IContact & {
  contacts: Record<string, IContact>;
};

/**
 * @category Contact
 */
const contactApi = {
  postContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts',
    method: 'POST',
    cache: true,
    queryArg: { name: '' as string, email: '' as string, phone: '' as string },
    resultType: {} as IContact
  },
  putContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts',
    method: 'PUT',
    cache: true,
    queryArg: { id: '' as string, name: '' as string, email: '' as string, phone: '' as string },
    resultType: {} as IContact
  },
  getContacts: {
    kind: EndpointType.QUERY,
    url: 'contacts',
    method: 'GET',
    cache: 180,
    queryArg: {} as Void,
    resultType: [] as IContact[]
  },
  getContactById: {
    kind: EndpointType.QUERY,
    url: 'contacts/:id',
    method: 'GET',
    cache: true,
    queryArg: { id: '' as string },
    resultType: {} as IContact
  },
  deleteContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts/:id',
    method: 'DELETE',
    cache: true,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  },
  disableContact: {
    kind: EndpointType.MUTATION,
    url: 'contacts/:id/disable',
    method: 'PUT',
    cache: true,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Contact
 */
const contactApiHandlers: ApiHandler<typeof contactApi> = {
  postContact: async props => {
    const { name, email, phone } = props.event.body;

    const contact = await props.db.one<IContact>(`
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

    const contact = await props.db.one<IContact>(`
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
    const contact = await props.db.query<IContact>(`
      DELETE FROM dbtable_schema.contacts
      WHERE id = $1
    `, [id]);
    return contact;
  },
  disableContact: async props => {
    const { id } = props.event.pathParameters;
    await props.db.query(`
      UPDATE dbtable_schema.contacts
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);
    return { id };
  },
}

type ContactApi = typeof contactApi;
type ContactApiHandler = typeof contactApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<ContactApi> { }
  interface SiteApiHandlerRef extends Extend<ContactApiHandler> { }
}

Object.assign(siteApiRef, contactApi);
Object.assign(siteApiHandlerRef, contactApiHandlers);