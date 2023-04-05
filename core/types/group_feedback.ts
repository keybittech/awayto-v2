import { Extend } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IFeedback } from './feedback';
import { IGroup } from './group';

/**
 * @category Group Feedback
 */
const groupFeedbackApi = {
  postGroupFeedback: {
    kind: EndpointType.MUTATION,
    url: 'feedback',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { message: '' as string, groupName: '' as string },
    resultType: {} as boolean
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

/**
 * @category Group Feedback
 */
const groupFeedbackApiHandlers: ApiHandler<typeof groupFeedbackApi> = {
  postGroupFeedback: async props => {
    const { message, groupName } = props.event.body;

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id FROM dbtable_schema.groups
      WHERE name = $1
    `, [groupName]);

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_feedback (message, group_id, created_sub, created_on)
      VALUES ($1, $2::uuid, $3::uuid, $4)
    `, [message, groupId, props.event.userSub, new Date()]);

    return true;
  },
  getGroupFeedback: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id FROM dbtable_schema.groups
      WHERE name = $1
    `, [groupName]);

    const feedback = await props.db.manyOrNone<IFeedback>(`
      SELECT f.id, f.message, f.created_on as "createdOn", u.username
      FROM dbtable_schema.group_feedback f
      JOIN dbtable_schema.users u ON u.sub = f.created_sub
      WHERE f.group_id = $1
      ORDER BY f.created_on DESC
    `, [groupId]);

    return feedback;
  },
} as const;

/**
 * @category Group Feedback
 */
type GroupFeedbackApi = typeof groupFeedbackApi;

/**
 * @category Group Feedback
 */
type GroupFeedbackApiHandler = typeof groupFeedbackApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupFeedbackApi> { }
  interface SiteApiHandlerRef extends Extend<GroupFeedbackApiHandler> { }
}

Object.assign(siteApiRef, groupFeedbackApi);
Object.assign(siteApiHandlerRef, groupFeedbackApiHandlers);