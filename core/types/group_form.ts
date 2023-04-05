import { asyncForEach, Extend } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IForm, IFormVersion } from './form';
import { IGroup } from './group';
import { IUserProfile } from './profile';

/**
 * @category Group Form
 */
export type IGroupForm = IForm & {
  id: string;
  groupId: string;
  formId: string;
  groupName: string;
};

/**
 * @category Group Form
 */
export type IGroupForms = Record<string, IGroupForm>;

/**
 * @category Group Form
 */
const groupFormApi = {
  postGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {} as IGroupForm,
    resultType: [] as IGroupForm[]
  },
  postGroupFormVersion: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms/:id',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {} as IGroupForm,
    resultType: [] as IGroupForm[]
  },
  putGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IGroupForm,
    resultType: {} as IGroupForm
  },
  getGroupForms: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/forms',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupForm[]
  },
  getGroupFormById: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/forms/:formId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, formId: '' as string },
    resultType: {} as IGroupForm
  },
  deleteGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;

/**
 * @category Group Form
 */
const groupFormApiHandlers: ApiHandler<typeof groupFormApi> = {
  postGroupForm: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const { sub: groupSub } = await props.db.one<IUserProfile>(`
      SELECT sub
      FROM dbview_schema.enabled_users
      WHERE username = $1
    `, ['system_group_' + groupName]);

    const form = await siteApiHandlerRef.postForm({
      ...props,
      event: {
        ...props.event,
        userSub: groupSub
      }
    }) as IGroupForm;

    form.groupId = groupId;

    const formVersion = await siteApiHandlerRef.postFormVersion({
      ...props,
      event: {
        ...props.event,
        pathParameters: {
          formId: form.id
        }
      }
    }) as IFormVersion;

    formVersion.formId = form.id;
    form.version = formVersion;

    await props.db.none(`
      INSERT INTO dbtable_schema.group_forms (group_id, form_id, created_sub)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (group_id, form_id) DO NOTHING
      RETURNING id
    `, [groupId, form.id, groupSub]);

    await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);

    return [form];
  },
  postGroupFormVersion: async props => {
    const { id: formId, groupName } = props.event.pathParameters;
    const form = props.event.body;

    form.version = await siteApiHandlerRef.postFormVersion(props) as IFormVersion;

    await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);
    await props.redis.del(`${props.event.userSub}group/${groupName}/forms/${formId}`);

    return [form];
  },
  putGroupForm: async props => {
    const { groupName } = props.event.pathParameters;

    const form = await siteApiHandlerRef.putForm(props) as IGroupForm;

    await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);
    await props.redis.del(`${props.event.userSub}group/${groupName}/forms/${form.id}`);

    return form;
  },
  getGroupForms: async props => {
    const { groupName } = props.event.pathParameters;
    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const forms = await props.db.manyOrNone<IGroupForm>(`
      SELECT es.*
      FROM dbview_schema.enabled_group_forms eus
      LEFT JOIN dbview_schema.enabled_forms es ON es.id = eus."formId"
      WHERE eus."groupId" = $1
    `, [groupId]);

    return forms;
  },
  getGroupFormById: async props => {
    const { groupName, formId } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName])

    const form = await props.db.one<IGroupForm>(`
      SELECT egfe.*
      FROM dbview_schema.enabled_group_forms_ext egfe
      WHERE egfe."groupId" = $1 and egfe."formId" = $2
    `, [groupId, formId]);

    return form;
  },
  deleteGroupForm: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async formId => {
      await props.db.none(`
        DELETE FROM dbtable_schema.group_forms
        WHERE form_id = $1
      `, [formId]);
      await props.db.none(`
        DELETE FROM dbtable_schema.form_versions
        WHERE form_id = $1
      `, [formId]);
      await props.db.none(`
        DELETE FROM dbtable_schema.forms
        WHERE id = $1
      `, [formId]);
    });

    await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);

    return idsSplit.map(id => ({ id }));
  }
} as const;

/**
 * @category Group Form
 */
type GroupFormApi = typeof groupFormApi;

/**
 * @category Group Form
 */
type GroupFormApiHandler = typeof groupFormApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupFormApi> { }
  interface SiteApiHandlerRef extends Extend<GroupFormApiHandler> { }
}

Object.assign(siteApiRef, groupFormApi);
Object.assign(siteApiHandlerRef, groupFormApiHandlers);