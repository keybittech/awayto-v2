import { IQuote, IQuoteActionTypes } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const quotes: ApiModule = [

  {
    action: IQuoteActionTypes.POST_QUOTE,
    cmnd : async (props) => {
      try {

        const { name, desiredDuration, budgetId, timelineId, serviceTierId, contactId, respondBy, description } = props.event.body;

        const response = await props.db.query<IQuote>(`
          INSERT INTO quotes (name, desired_duration, budget_id, timeline_id, service_tier_id, contact_id, respond_by, description)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, name, desired_duration as "desiredDuration", budget_id as "budgetId", timeline_id as "timelineId", service__tier_id as "serviceTierId", contact_id as "contactId", respond_by as "respondBy", description
        `, [name, desiredDuration, budgetId, timelineId, serviceTierId, contactId, respondBy, description]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IQuoteActionTypes.PUT_QUOTE,
    cmnd : async (props) => {
      try {

        const {  } = props.event.body;

        const { id, budgetId, timelineId, serviceTierId, contactId, respondBy, description } = props.event.body;
        
        if (!id || !budgetId || !timelineId || !serviceTierId || !contactId) throw new Error('Must provide ids for budget, timeline, and service tier');

        const updateProps = buildUpdate({ id, budgetId, timelineId, serviceTierId, contactId, respondBy, description });

        const response = await props.db.query<IQuote>(`
          UPDATE quotes
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
          DELETE FROM quotes
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
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE quotes
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default quotes;