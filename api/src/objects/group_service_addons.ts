import { IGroup, IGroupServiceAddon } from 'awayto';
import { ApiModule } from '../api';

const groupServiceAddons: ApiModule = [

  {
    method: 'GET',
    path : 'group/:groupName/service_addons/:serviceAddonId',
    cmnd : async (props) => {
      try {
        const { groupName, serviceAddonId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Attach service addon to group
        await props.db.query(`
          INSERT INTO uuid_service_addons (parent_uuid, service_addon_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, service_addon_id) DO NOTHING
          RETURNING id
        `, [groupId, serviceAddonId, props.event.userSub]);
        
        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'GET',
    path : 'group/:groupName/service_addons',
    cmnd : async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupServiceAddon>(`
          SELECT esa.*, eusa."parentUuid" as "groupId"
          FROM dbview_schema.enabled_uuid_service_addons eusa
          LEFT JOIN dbview_schema.enabled_service_addons esa ON esa.id = eusa."serviceAddonId"
          WHERE eusa."parentUuid" = $1
        `, [groupId]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'group/:groupName/service_addons/:serviceAddonId',
    cmnd : async (props) => {
      try {

        const { groupName, serviceAddonId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        await props.db.query<IGroupServiceAddon>(`
          DELETE FROM uuid_service_addons
          WHERE parent_uuid = $1 AND service_addon_id = $2
          RETURNING id
        `, [groupId, serviceAddonId]);
        
        return [{ id: serviceAddonId }];
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'group/:groupName/service_addons/:id/disable',
    cmnd : async (props) => {
      try {

        const { groupName, serviceAddonId } = props.event.pathParameters;

        // const [{ id: groupId }] = (await props.db.query<IGroup>(`
        //   SELECT id
        //   FROM dbview_schema.enabled_groups
        //   WHERE name = $1
        // `, [groupName])).rows

        await props.db.query(`
          UPDATE service_addons
          SET enabled = false
          WHERE id = $1
        `, [serviceAddonId]);

        return { id: serviceAddonId };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default groupServiceAddons;