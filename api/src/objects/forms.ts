import { ApiModule } from '../util/db';

import { ILookup, ITimeUnit } from 'awayto';

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
        const timeUnits = (await props.client.query<ITimeUnit>(`
          SELECT * FROM time_units
        `)).rows;
        
        return {
          budgets,
          timelines,
          timeUnits
        };
        
      } catch (error) {
        throw error;
      }

    }
  },

]

export default forms;