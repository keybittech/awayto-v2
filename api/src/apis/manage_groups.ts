import { IGroup, IUuidRoles, DbError, IGroupState, IManageGroupsActionTypes, IManageGroupsState } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const manageGroups: ApiModule = [

  {
    action: IManageGroupsActionTypes.POST_MANAGE_GROUPS,
    cmnd : async (props) => {
      try {

        const { name, roles } = props.event.body;

        const { rows: [ group ] } = await props.db.query<IGroup>(`
          INSERT INTO groups (name, created_on)
          VALUES ($1, $2)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name
        `, [name, new Date()]);

        await asyncForEach(Object.values(roles), async role => {
          await props.db.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, new Date(), props.event.userSub])
        });

        group.roles = roles;
        
        return group;

      } catch (error) {
        const { constraint } = error as DbError;
        
        if ('unique_group_owner' === constraint) {
          throw { reason: 'Only 1 group can be managed at a time.'}
        }

        throw error;
      }
    }
  },

  {
    action: IManageGroupsActionTypes.PUT_MANAGE_GROUPS,
    cmnd : async (props) => {
      try {
        const { id, name, roles } = props.event.body;

        const updateProps = buildUpdate({ id, name });

        const { rows: [ group ] } = await props.db.query<IGroup>(`
          UPDATE groups
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        const rolesValues = Object.values(roles);

        const roleIds = rolesValues.map(r => r.id);
        const diffs = (await props.db.query<IUuidRoles>('SELECT id, role_id as "roleId" FROM uuid_roles WHERE parent_uuid = $1', [group.id])).rows.filter(r => !roleIds.includes(r.roleId)).map(r => r.id) as string[];

        if (diffs.length) {
          await asyncForEach(diffs, async diff => {
            await props.db.query('DELETE FROM uuid_roles WHERE id = $1', [diff]);
          });          
        }

        await asyncForEach(rolesValues, async role => {
          await props.db.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, new Date(), props.event.userSub])
        });

        group.roles = roles;

        return group;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageGroupsActionTypes.GET_MANAGE_GROUPS,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IGroup>(`
          SELECT * FROM dbview_schema.enabled_groups_ext
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageGroupsActionTypes.DELETE_MANAGE_GROUPS,
    cmnd : async (props) => {
      try {

        const query = props.event.queryParameters;
        const ids = query.ids.split(',');

        await asyncForEach(ids, async id => {
          await props.db.query(`
            DELETE FROM groups
            WHERE id = $1
          `, [id]);
        })

        return ids.map<Partial<IGroup>>(id => ({ id }));
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageGroupsActionTypes.DISABLE_MANAGE_GROUPS,
    cmnd : async (props) => {
      try {
        const groups = props.event.body;

        // await asyncForEach(groups, async group => {
        //   await props.db.query(`
        //     UPDATE groups
        //     SET enabled = false
        //     WHERE id = $1
        //   `, [group.id]);
        // });

        return groups;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageGroupsActionTypes.CHECK_GROUP_NAME,
    cmnd : async (props) => {
      try {
        const { name } = props.event.pathParameters;

        const { rows: [{ count }] } = await props.db.query<{count: number}>(`
          SELECT COUNT(*) as count
          FROM groups
          WHERE name = $1
        `, [name]);

        return { checkingName: false, isValid: count == 0 } as IManageGroupsState;
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default manageGroups;