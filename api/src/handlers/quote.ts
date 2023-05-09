import { ApiHandlers, IFormVersionSubmission, IQuote, buildUpdate, utcNowString, asyncForEach } from 'awayto/core';
import fileApiHandler from './file';

export default {
  postQuote: async props => {
    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const quote = { ...props.event.body } as IQuote;
    const { serviceForm, tierForm, slotDate, scheduleBracketSlotId, serviceTierId, files } = quote;

    await asyncForEach([serviceForm, tierForm], async form => {
      if (form && Object.keys(form).length) {
        const { id: formId } = await props.tx.one<IFormVersionSubmission>(`
          INSERT INTO dbtable_schema.form_version_submissions (form_version_id, submission, created_sub)
          VALUES ($1, $2::jsonb, $3::uuid)
          RETURNING id
        `, [form.formVersionId, form.submission, props.event.userSub]);

        form.id = formId;
      }
    });

    if (files.length) {
      await Promise.all(files.map(file => {
        return fileApiHandler.postFile({
          ...props,
          event: {
            ...props.event,
            body: file
          }
        });
      }));
    }

    const { id: quoteId } = await props.tx.one<IQuote>(`
      INSERT INTO dbtable_schema.quotes (slot_date, schedule_bracket_slot_id, service_tier_id, service_form_version_submission_id, tier_form_version_submission_id, created_sub)
      VALUES ($1::date, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid)
      RETURNING id
    `, [slotDate, scheduleBracketSlotId, serviceTierId, serviceForm?.id, tierForm?.id, props.event.userSub]);

    if (serviceForm?.id) {
      quote.serviceFormVersionSubmissionId = serviceForm.id;
    }

    if (tierForm?.id) {
      quote.tierFormVersionSubmissionId = tierForm.id;
    }

    quote.id = quoteId;

    const { staffSub } = await props.tx.one<{ staffSub: string }>(`
      SELECT created_sub as "staffSub"
      FROM dbtable_schema.schedule_bracket_slots
      WHERE id = $1
    `, [scheduleBracketSlotId]);

    try {
      await props.keycloak.users.addClientRoleMappings({
        id: staffSub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });
      await props.redis.del(`${staffSub}quotes`);
      await props.redis.del(`${staffSub}profile/details`);
    } catch (error) { }

    return [quote];
  },
  putQuote: async props => {
    const { id, serviceTierId } = props.event.body;

    const updateProps = buildUpdate({
      id,
      service_tier_id: serviceTierId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const quote = await props.tx.one<IQuote>(`
      UPDATE dbtable_schema.quotes
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name, desired_duration as "desiredDuration", budget_id as "budgetId", timeline_id as "timelineId", service__tier_id as "serviceTierId", contact_id as "contactId", respond_by as "respondBy", description
    `, updateProps.array);

    return quote;
  },
  getQuotes: async props => {
    const quotes = await props.db.manyOrNone<IQuote>(`
      SELECT q.*
      FROM dbview_schema.enabled_quotes q
      JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = q."scheduleBracketSlotId"
      WHERE sbs.created_sub = $1
    `, [props.event.userSub]);
    return quotes;
  },
  getQuoteById: async props => {
    const { id } = props.event.pathParameters;
    const quote = await props.db.one<IQuote>(`
      SELECT * FROM dbview_schema.enabled_quotes_ext
      WHERE id = $1
    `, [id]);

    return quote;
  },
  deleteQuote: async props => {
    const { id } = props.event.pathParameters;
    await props.tx.none(`
      DELETE FROM dbtable_schema.quotes
      WHERE id = $1
    `, [id]);

    return { id };
  },
  disableQuote: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');
    await asyncForEach(idsSplit, async id => {
      await props.tx.none(`
        UPDATE dbtable_schema.quotes
        SET enabled = false, updated_on = $2, updated_sub = $3
        WHERE id = $1
      `, [id, utcNowString(), props.event.userSub]);
    });

    await props.redis.del(`${props.event.userSub}quotes`);
    await props.redis.del(`${props.event.userSub}profile/details`);

    return idsSplit.map(id => ({ id }));
  }
} as Pick<
  ApiHandlers,
  'postQuote' |
  'putQuote' |
  'getQuotes' |
  'getQuoteById' |
  'deleteQuote' |
  'disableQuote'
>;