import { ApiOptions, EndpointType } from './api';

/**
 * @category Feedback
 * @purpose contains elements allowing users to give feedback to the site owner or group owners
 */
export type IFeedback = {
  id: string;
  message: string;
  createdOn: string;
}

/**
 * @category Site Feedback
 */
export default {
  postSiteFeedback: {
    kind: EndpointType.MUTATION,
    url: 'feedback',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { message: '' as string },
    resultType: { success: true as boolean }
  }
} as const;