import { Void } from '../util'
import { ApiOptions, EndpointType } from './api';
import { ITimeUnit } from './time_unit';

/**
 * @category Lookup
 * @purpose stores basic id/name style lookup objects for use with simple list-data input situations
 */
export type ILookup = {
  id: string;
  name: string;
}

/**
 * @category Lookup
 */
export default {
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