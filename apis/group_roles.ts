import { asyncForEach, IGroup, IGroupRole, IGroupRoleActionTypes, IGroupService, IGroupServiceAddon, IForm, IFormActionTypes, IUserProfile, IFormVersion } from 'awayto/core';
import { ApiEvent, ApiModule } from '../api';

const groupRoles: ApiModule = [

  {
    action: IGroupRoleActionTypes.POST_GROUP_ROLE,
    cmnd: async (props) => {
      try {

        return true;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupRoleActionTypes.PUT_GROUP_ROLE,
    cmnd: async (props) => {
      try {

        return true;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupRoleActionTypes.GET_GROUP_ROLES,
    cmnd: async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupRole>(`
          SELECT 
            er.id,
            er.name,
            egr."roleId",
            egr."groupId",
            egr."externalId"
          FROM dbview_schema.enabled_group_roles egr
          JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
          WHERE egr."groupId" = $1
        `, [groupId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },


  {
    action: IGroupRoleActionTypes.DELETE_GROUP_ROLE,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        await asyncForEach(idsSplit, async roleId => {
          // Detach role from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_roles
            WHERE role_id = $1
          `, [roleId]);
        });

        await props.redis.del(props.event.userSub + `group/${groupName}/roles`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupRoles;