import { ApiHandlers, IPayment, buildUpdate, utcNowString } from 'awayto/core';

export default {
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
} as Pick<
  ApiHandlers,
  'postPayment' |
  'putPayment' |
  'getPayments' |
  'getPaymentById' |
  'deletePayment' |
  'disablePayment'
>;