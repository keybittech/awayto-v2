import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IContactState> {}
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
 * @category Action Types
 */
export enum IContactActionTypes {
  POST_CONTACT = "POST/contacts",
  PUT_CONTACT = "PUT/contacts",
  GET_CONTACTS = "GET/contacts",
  GET_CONTACT_BY_ID = "GET/contacts/:id",
  DELETE_CONTACT = "DELETE/contacts/:id",
  DISABLE_CONTACT = "PUT/contacts/:id/disable"
}