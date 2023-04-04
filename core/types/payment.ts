import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IPaymentState> {}
}

/**
 * @category Payment
 */
export type IPayment = {
  id: string;
  contactId: string;
  details: Record<string, unknown>;
};

/**
 * @category Payment
 */
export type IPaymentState = IPayment;

/**
 * @category Action Types
 */
export enum IPaymentActionTypes {
  POST_PAYMENT = "POST/payments",
  PUT_PAYMENT = "PUT/payments",
  GET_PAYMENTS = "GET/payments",
  GET_PAYMENT_BY_ID = "GET/payments/:id",
  DELETE_PAYMENT = "DELETE/payments/:id",
  DISABLE_PAYMENT = "PUT/payments/:id/disable"
}