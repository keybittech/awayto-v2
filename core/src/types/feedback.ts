/**
 * @category Feedback
 * @purpose contains elements allowing users to give feedback to the site owner or group owners
 */
export type IFeedback = {
  id: string;
  message: string;
  groupName: string;
  createdOn: string;
}