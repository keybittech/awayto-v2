import moment from 'moment';

import { IGroup, IUuidRoles, DbError, IManageGroupsActionTypes, IManageGroupsState, asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const manageGroups: ApiModule = [

  {
    action: IManageGroupsActionTypes.POST_MANAGE_GROUPS,
    cmnd : async (props) => {
      try {

        const { name, roles } = props.event.body;

        const { rows: [ group ] } = await props.db.query<IGroup>(`
          INSERT INTO dbtable_schema.groups (name, created_on, created_sub)
          VALUES ($1, $2, $3::uuid)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name
        `, [name, moment().utc(), props.event.userSub]);

        await asyncForEach(Object.values(roles), async role => {
          await props.db.query(`
            INSERT INTO dbtable_schema.uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4::uuid)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, moment().utc(), props.event.userSub])
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

        const updateProps = buildUpdate({
          id,
          name,
          updated_sub: props.event.userSub,
          updated_on: moment().utc()
        });

        const { rows: [ group ] } = await props.db.query<IGroup>(`
          UPDATE dbtable_schema.groups
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
            INSERT INTO dbtable_schema.uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4::uuid)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, moment().utc(), props.event.userSub])
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
            DELETE FROM dbtable_schema.groups
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
          FROM dbtable_schema.groups
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