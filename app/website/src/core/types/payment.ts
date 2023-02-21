import { PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    payments: IPaymentState
  }

  interface IMergedState extends Merge<unknown, IPaymentState> {}

  /**
   * @category Awayto Redux
   */
  type IPaymentModuleActions = IPaymentActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    payments: IPaymentActionTypes;
  }
}


/**
 * @category Awayto
 */
export type IPayment = {
  id: string;
  contactId: string;
  details: Record<string, unknown>;
};

/**
 * @category Payment
 */
export type IPaymentState = Partial<IPayment>;

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

/**
 * @category Payment
 */
export type IPostPaymentAction = PayloadAction<IPaymentActionTypes.POST_PAYMENT, IPayment>;

/**
 * @category Payment
 */
export type IPutPaymentAction = PayloadAction<IPaymentActionTypes.PUT_PAYMENT, IPayment>;

/**
 * @category Payment
 */
export type IGetPaymentsAction = PayloadAction<IPaymentActionTypes.GET_PAYMENTS, IPayment>;

/**
 * @category Payment
 */
export type IGetPaymentByIdAction = PayloadAction<IPaymentActionTypes.GET_PAYMENT_BY_ID, IPayment>;

/**
 * @category Payment
 */
export type IDeletePaymentAction = PayloadAction<IPaymentActionTypes.DELETE_PAYMENT, IPaymentState>;

/**
 * @category Payment
 */
export type IDisablePaymentAction = PayloadAction<IPaymentActionTypes.DISABLE_PAYMENT, IPaymentState>;

/**
 * @category Payment
 */
export type IPaymentActions = IPostPaymentAction 
  | IPutPaymentAction 
  | IGetPaymentsAction 
  | IGetPaymentByIdAction
  | IDeletePaymentAction
  | IDisablePaymentAction;
