import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IFeedbackState> {}
}

/**
 * @category Feedback
 */
export type IFeedback = {
  id: string;
  message: string;
  groupName: string;
  createdOn: string;
  username: string;
}

/**
 * @category Feedback
 */
export type IFeedbackState = IFeedback & {
  feedbacks: Record<string, IFeedback>;
}

/**
 * @category Action Types
 */
export enum IFeedbackActionTypes {
  POST_FEEDBACK = "POST/feedback",
  GET_FEEDBACK = "GET/group/:groupName/feedback"
}