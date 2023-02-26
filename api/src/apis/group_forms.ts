import { asyncForEach, IGroup, IGroupForm, IGroupFormActionTypes, IGroupService, IGroupServiceAddon, IForm, IFormActionTypes, IUserProfile } from 'awayto';
import { ApiEvent, ApiModule } from '../api';
import forms from './forms';

const groupServices: ApiModule = [

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
          event: {
            ...props.event,
            userSub: groupSub,
            body: props.event.body
          } as ApiEvent,
          db: props.db,
          redis: props.redis
        }) as [IGroupForm];

        form.groupId = groupId;

        // Attach form to group
        await props.db.query(`
          INSERT INTO dbtable_schema.group_forms (group_id, form_id, created_sub)
          VALUES ($1, $2, $3::uuid)
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
        const { formId } = props.event.pathParameters;

        const response = await props.db.query<IGroupForm>(`
          SELECT egse.*
          FROM dbview_schema.enabled_group_forms_ext egse
          WHERE egse."parentFormId" = $1
        `, [formId]);

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

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        await asyncForEach(idsSplit, async formId => {
          // Detach form from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_forms
            WHERE group_id = $1 AND form_id = $2
            RETURNING id
          `, [groupId, formId]);
        })

        await props.redis.del(props.event.userSub + `group/${groupName}/forms`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupServices;