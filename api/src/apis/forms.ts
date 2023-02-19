import { ApiModule } from '../api';

import { ILookup, ITimeUnit } from 'awayto';

const forms: ApiModule = [

  {
    method: 'GET',
    path : 'forms',
    cmnd : async (props) => {
      try {

        const budgets = (await props.db.query<ILookup>(`
          SELECT * FROM budgets
        `)).rows;
        const timelines = (await props.db.query<ILookup>(`
          SELECT * FROM timelines
        `)).rows;
        const timeUnits = (await props.db.query<ITimeUnit>(`
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