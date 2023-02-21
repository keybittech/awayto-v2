import { ApiModule } from '../api';

import { IFormActionTypes, ILookup, ITimeUnit } from 'awayto';

const forms: ApiModule = [

  {
    action: IFormActionTypes.GET_FORMS,
    cmnd : async (props) => {
      try {

        const budgets = (await props.db.query<ILookup>(`
          SELECT * FROM dbtable_schema.budgets
        `)).rows;
        const timelines = (await props.db.query<ILookup>(`
          SELECT * FROM dbtable_schema.timelines
        `)).rows;
        const timeUnits = (await props.db.query<ITimeUnit>(`
          SELECT * FROM dbtable_schema.time_units
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