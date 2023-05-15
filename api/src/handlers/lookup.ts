import { ILookup, ITimeUnit, createHandlers } from 'awayto/core';

export default createHandlers({
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
});