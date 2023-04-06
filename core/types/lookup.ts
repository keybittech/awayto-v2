import { Extend, Void } from '../util'
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { ITimeUnit } from './time_unit';

/**
 * @category Lookup
 */
export type ILookup = {
  id: string;
  name: string;
}

/**
 * @category Lookup
 */
const lookupApi = {
  getLookups: {
    kind: EndpointType.QUERY,
    url: 'lookup',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: {
      budgets: [] as ILookup[],
      timelines: [] as ILookup[],
      timeUnits: [] as ITimeUnit[]
    }
  },
} as const;

/**
 * @category Lookup
 */
const lookupApiHandlers: ApiHandler<typeof lookupApi> = {
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
} as const;

/**
 * @category Lookup
 */
type LookupApi = typeof lookupApi;

/**
 * @category Lookup
 */
type LookupApiHandler = typeof lookupApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<LookupApi> { }
  interface SiteApiHandlerRef extends Extend<LookupApiHandler> { }
}

Object.assign(siteApiRef, lookupApi);
Object.assign(siteApiHandlerRef, lookupApiHandlers);
