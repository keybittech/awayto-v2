import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    contacts: IContactState
  }

  /**
   * @category Awayto Redux
   */
  type IContactModuleActions = IContactActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    contacts: IContactActionTypes;
  }
}


/**
 * @category Awayto
 */
export type IContact = {
  id?: string;
  name: string;
  email: string;
  phone: string;
};

/**
 * @category Contact
 */
export type IContactState = Partial<IContact>;

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

/**
 * @category Contact
 */
export type IPostContactAction = PayloadAction<IContactActionTypes.POST_CONTACT, IContact>;

/**
 * @category Contact
 */
export type IPutContactAction = PayloadAction<IContactActionTypes.PUT_CONTACT, IContact>;

/**
 * @category Contact
 */
export type IGetContactsAction = PayloadAction<IContactActionTypes.GET_CONTACTS, IContact>;

/**
 * @category Contact
 */
export type IGetContactByIdAction = PayloadAction<IContactActionTypes.GET_CONTACT_BY_ID, IContact>;

/**
 * @category Contact
 */
export type IDeleteContactAction = PayloadAction<IContactActionTypes.DELETE_CONTACT, IContactState>;

/**
 * @category Contact
 */
export type IDisableContactAction = PayloadAction<IContactActionTypes.DISABLE_CONTACT, IContactState>;

/**
 * @category Contact
 */
export type IContactActions = IPostContactAction 
  | IPutContactAction 
  | IGetContactsAction 
  | IGetContactByIdAction
  | IDeleteContactAction
  | IDisableContactAction;
