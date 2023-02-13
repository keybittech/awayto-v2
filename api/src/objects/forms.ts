import { ApiModule } from '../util/db';

import { ILookup } from 'awayto';

const forms: ApiModule = [

  {
    method: 'GET',
    path : 'forms',
    cmnd : async (props) => {
      try {

        const budgets = (await props.client.query<ILookup>(`
          SELECT * FROM budgets
        `)).rows;
        const timelines = (await props.client.query<ILookup>(`
          SELECT * FROM timelines
        `)).rows;
        const scheduleContexts = (await props.client.query<ILookup>(`
          SELECT * FROM schedule_contexts
        `)).rows;
        
        return {
          budgets,
          timelines,
          scheduleContexts
        };
        
      } catch (error) {
        throw error;
      }

    }
  },

]

export default forms;