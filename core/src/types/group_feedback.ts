import { ApiOptions, EndpointType } from './api';
import { IFeedback } from './feedback';

/**
 * @category Group Feedback
 */
export default {
  postGroupFeedback: {
    kind: EndpointType.MUTATION,
    url: 'feedback',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { message: '' as string, groupName: '' as string },
    resultType: { success: true as boolean }
  },
  getGroupFeedback: {
    kind: EndpointType.QUERY,
    url: 'feedback/:groupName',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IFeedback[]
  },
} as const;