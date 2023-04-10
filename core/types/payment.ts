import { AnyRecord, Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

/**
 * @category Payment
 * @purpose records the metadata of monetary transactions that occur in the application
 */
export type IPayment = {
  id: string;
  contactId: string;
  details: AnyRecord;
};

/**
 * @category Payment
 */
const paymentApi = {
  postPayment: {
    kind: EndpointType.MUTATION,
    url: 'payments',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {} as IPayment,
    resultType: {} as IPayment
  },
  putPayment: {
    kind: EndpointType.MUTATION,
    url: 'payments',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IPayment,
    resultType: {} as IPayment
  },
  getPayments: {
    kind: EndpointType.QUERY,
    url: 'payments',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IPayment[]
  },
  getPaymentById: {
    kind: EndpointType.QUERY,
    url: 'payments/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IPayment
  },
  deletePayment: {
    kind: EndpointType.MUTATION,
    url: 'payments/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IPayment
  },
  disablePayment: {
    kind: EndpointType.MUTATION,
    url: 'payments/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Payment
 */
const paymentApiHandlers: ApiHandler<typeof paymentApi> = {
  postPayment: async props => {
    const { contactId, details } = props.event.body;

    const payment = await props.tx.one<IPayment>(`
      INSERT INTO dbtable_schema.payments (contact_id, details, created_sub)
      VALUES ($1, $2, $3::uuid)
      RETURNING id, contact_id as "contactId", details
    `, [contactId, details, props.event.userSub]);
    
    return payment;
  },
  putPayment: async props => {
    const { id, contactId, details } = props.event.body;

    const updateProps = buildUpdate({
      id,
      contact_id: contactId,
      details: JSON.stringify(details),
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const payment = await props.tx.one<IPayment>(`
      UPDATE dbtable_schema.payments
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, contact_id as "contactId", details
    `, updateProps.array);

    return payment;
  },
  getPayments: async props => {
    const payments = await props.db.manyOrNone<IPayment>(`
      SELECT * FROM dbview_schema.enabled_payments
    `);
    
    return payments;
  },
  getPaymentById: async props => {
    const { id } = props.event.pathParameters;

    const payment = await props.db.one<IPayment>(`
      SELECT * FROM dbview_schema.enabled_payments
      WHERE id = $1
    `, [id]);
    
    return payment;
  },
  deletePayment: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.payments
      WHERE id = $1
    `, [id]);
    
    return { id };
  },
  disablePayment: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.payments
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  }
} as const;

/**
 * @category Payment
 */
type PaymentApi = typeof paymentApi;

/**
 * @category Payment
 */
type PaymentApiHandler = typeof paymentApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<PaymentApi> { }
  interface SiteApiHandlerRef extends Extend<PaymentApiHandler> { }
}

Object.assign(siteApiRef, paymentApi);
Object.assign(siteApiHandlerRef, paymentApiHandlers);