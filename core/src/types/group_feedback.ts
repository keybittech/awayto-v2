import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IFeedback } from './feedback';

export type IGroupFeedback = IFeedback;

/**
 * @category Group Feedback
 */
export default {
  postGroupFeedback: {
    kind: EndpointType.MUTATION,
    url: 'group/feedback',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { message: '' as string },
    resultType: { success: true as boolean }
  },
  getGroupFeedback: {
    kind: EndpointType.QUERY,
    url: 'group/feedback',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroupFeedback[]
  },
} as const;