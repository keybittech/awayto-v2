import { IGroupServiceAddon, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroupServiceAddon: async props => {
    const { serviceAddonId } = props.event.pathParameters;

    await props.tx.none(`
      INSERT INTO dbtable_schema.uuid_service_addons (parent_uuid, service_addon_id, created_sub)
      VALUES ($1, $2, $3::uuid)
      ON CONFLICT (parent_uuid, service_addon_id) DO NOTHING
    `, [props.event.group.id, serviceAddonId, props.event.userSub]);

    await props.redis.del(props.event.userSub + `group/service_addons`);

    return [];
  },
  getGroupServiceAddons: async props => {
    const groupServiceAddons = await props.db.manyOrNone<IGroupServiceAddon>(`
      SELECT esa.*, eusa."parentUuid" as "groupId"
      FROM dbview_schema.enabled_uuid_service_addons eusa
      LEFT JOIN dbview_schema.enabled_service_addons esa ON esa.id = eusa."serviceAddonId"
      WHERE eusa."parentUuid" = $1
    `, [props.event.group.id]);

    return groupServiceAddons;
  },
  deleteGroupServiceAddon: async props => {
    const { serviceAddonId } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.uuid_service_addons
      WHERE parent_uuid = $1 AND service_addon_id = $2
    `, [props.event.group.id, serviceAddonId]);

    await props.redis.del(props.event.userSub + `group/service_addons`);

    return [{ id: serviceAddonId }];
  }
});
