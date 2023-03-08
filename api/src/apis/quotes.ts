import { asyncForEach, IFormVersionSubmission, IQuote, IQuoteActionTypes, utcNowString } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const quotes: ApiModule = [

  {
    action: IQuoteActionTypes.POST_QUOTE,
    cmnd : async (props) => {
      try {

        const quote = props.event.body;
        const { serviceForm, tierForm, slotDate, scheduleBracketSlotId, serviceTierId } = quote;

        await asyncForEach([serviceForm, tierForm], async form => {
          if (form) {
            const { rows: [{ id: formId }] } = await props.db.query<IFormVersionSubmission>(`
              INSERT INTO dbtable_schema.form_version_submissions (form_version_id, submission, created_sub)
              VALUES ($1, $2::jsonb, $3::uuid)
              RETURNING id
            `, [form.formVersionId, form.submission, props.event.userSub]);

            form.id = formId;
          }
        });
        
        const { rows: [{ id: quoteId }]} = await props.db.query<IQuote>(`
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

        return [quote];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IQuoteActionTypes.PUT_QUOTE,
    cmnd : async (props) => {
      try {

        const { id, serviceTierId, } = props.event.body;

        const updateProps = buildUpdate({
          id,
          service_tier_id: serviceTierId,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<IQuote>(`
          UPDATE dbtable_schema.quotes
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name, desired_duration as "desiredDuration", budget_id as "budgetId", timeline_id as "timelineId", service__tier_id as "serviceTierId", contact_id as "contactId", respond_by as "respondBy", description
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IQuoteActionTypes.GET_QUOTES,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IQuote>(`
          SELECT * FROM dbview_schema.enabled_quotes
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IQuoteActionTypes.GET_QUOTE_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IQuote>(`
          SELECT * FROM dbview_schema.enabled_quotes_ext
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IQuoteActionTypes.DELETE_QUOTE,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IQuote>(`
          DELETE FROM dbtable_schema.quotes
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IQuoteActionTypes.DISABLE_QUOTE,
    cmnd : async (props) => {
      try {
        const { ids } = props.event.pathParameters;

        await asyncForEach(ids.split(','), async id => {
          await props.db.query(`
            UPDATE dbtable_schema.quotes
            SET enabled = false, updated_on = $2, updated_sub = $3
            WHERE id = $1
          `, [id, utcNowString(), props.event.userSub]);
        });

        await props.redis.del(`${props.event.userSub}quotes`);
  
        return ids.split(',').map(id => ({ id }));
        
      } catch (error) {
        throw error;
      }

    }
  }
]

export default quotes;