import { ApiOptions, EndpointType } from './api';
import { IFeedback } from './feedback';

export type IGroupFeedback = IFeedback & {
  groupName: string;
}

/**
 * @category Group Feedback
 */
export default {
  postGroupFeedback: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/feedback',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { message: '' as string, groupName: '' as string },
    resultType: { success: true as boolean }
  },
  getGroupFeedback: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/feedback',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupFeedback[]
  },
} as const;