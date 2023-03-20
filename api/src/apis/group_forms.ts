import { asyncForEach, IGroup, IGroupForm, IGroupFormActionTypes, IGroupService, IGroupServiceAddon, IForm, IFormActionTypes, IUserProfile, IFormVersion } from 'awayto';
import { ApiEvent, ApiModule } from '../api';
import forms from './forms';

const groupForms: ApiModule = [

  {
    action: IGroupFormActionTypes.POST_GROUP_FORM,
    cmnd: async (props) => {
      try {

        const { groupName } = props.event.pathParameters;

        const { rows: [{ id: groupId }] } = await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName]);

        const { rows: [{ sub: groupSub }] } = await props.db.query<IUserProfile>(`
          SELECT sub
          FROM dbview_schema.enabled_users
          WHERE username = $1
        `, ['system_group_' + groupName]);

        const postForm = forms.find(api => api.action === IFormActionTypes.POST_FORM);
        const [form] = await postForm?.cmnd({
          ...props,
          event: {
            ...props.event,
            userSub: groupSub
          }
        }) as [IGroupForm];

        form.groupId = groupId;

        const postFormVersion = forms.find(api => api.action === IFormActionTypes.POST_FORM_VERSION);
        const [formVersion] = await postFormVersion?.cmnd({
          ...props,
          event: {
            ...props.event,
            pathParameters: {
              formId: form.id
            }
          }
        }) as [IFormVersion];
        
        formVersion.formId = form.id;
        form.version = formVersion;

        // Attach form to group
        await props.db.query(`
          INSERT INTO dbtable_schema.group_forms (group_id, form_id, created_sub)
          VALUES ($1::uuid, $2::uuid, $3::uuid)
          ON CONFLICT (group_id, form_id) DO NOTHING
          RETURNING id
        `, [groupId, form.id, groupSub]);

        await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);

        return [form];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupFormActionTypes.POST_GROUP_FORM_VERSION,
    cmnd: async (props) => {
      const { id: formId, groupName } = props.event.pathParameters;
      const form = props.event.body as IGroupForm;
      const postFormVersion = forms.find(api => api.action === IFormActionTypes.POST_FORM_VERSION);
      const [version] = await postFormVersion?.cmnd(props) as [IFormVersion];

      form.version = version;

      await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);
      await props.redis.del(`${props.event.userSub}group/${groupName}/forms/${formId}`);

      return [form];
    }
  },

  {
    action: IGroupFormActionTypes.PUT_GROUP_FORM,
    cmnd: async (props) => {
      try {

        const { groupName } = props.event.pathParameters;

        const postForm = forms.find(api => api.action === IFormActionTypes.PUT_FORM);

        const [form] = await postForm?.cmnd({
          event: {
            ...props.event,
            body: props.event.body
          } as ApiEvent,
          db: props.db,
          redis: props.redis
        }) as [IGroupForm];

        await props.redis.del(`${props.event.userSub}group/${groupName}/forms`);
        await props.redis.del(`${props.event.userSub}group/${groupName}/forms/${form.id}`);

        return [form];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupFormActionTypes.GET_GROUP_FORMS,
    cmnd: async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupForm>(`
          SELECT es.*
          FROM dbview_schema.enabled_group_forms eus
          LEFT JOIN dbview_schema.enabled_forms es ON es.id = eus."formId"
          WHERE eus."groupId" = $1
        `, [groupId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupFormActionTypes.GET_GROUP_FORM_BY_ID,
    cmnd: async (props) => {
      try {
        const { groupName, formId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupForm>(`
          SELECT egfe.*
          FROM dbview_schema.enabled_group_forms_ext egfe
          WHERE egfe."groupId" = $1 and egfe."formId" = $2
        `, [groupId, formId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupFormActionTypes.DELETE_GROUP_FORM,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        await asyncForEach(idsSplit, async formId => {
          // Detach form from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_forms
            WHERE form_id = $1
          `, [formId]);
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.form_versions
            WHERE form_id = $1
          `, [formId]);
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.forms
            WHERE id = $1
          `, [formId]);
        });

        await props.redis.del(props.event.userSub + `group/${groupName}/forms`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupForms;