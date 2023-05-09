import { ApiHandlers, ILookup, ITimeUnit } from 'awayto/core';

export default {
  getLookups: async props => {
    const budgets = await props.db.many<ILookup>(`
      SELECT id, name FROM dbtable_schema.budgets
    `);
    const timelines = await props.db.many<ILookup>(`
      SELECT id, name FROM dbtable_schema.timelines
    `);
    const timeUnits = await props.db.many<ITimeUnit>(`
      SELECT id, name FROM dbtable_schema.time_units
    `);
    
    return {
      budgets,
      timelines,
      timeUnits
    };
  },
} as Pick<
  ApiHandlers,
  'getLookups'
>;