import { IGroupService, asyncForEach, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroupService: async props => {
    await props.tx.none(`
      INSERT INTO dbtable_schema.group_services (group_id, service_id, created_sub)
      VALUES ($1, $2, $3::uuid)
      ON CONFLICT (group_id, service_id) DO NOTHING
    `, [props.event.group.id, props.event.body.serviceId, props.event.userSub]);

    await props.redis.del(props.event.userSub + `group/${props.event.group.name}/services`);

    return [];
  },
  getGroupServices: async props => {
    const groupServices = await props.db.manyOrNone<IGroupService>(`
      SELECT es.*, egs."groupId"
      FROM dbview_schema.enabled_group_services egs
      LEFT JOIN dbview_schema.enabled_services es ON es.id = egs."serviceId"
      WHERE egs."groupId" = $1
    `, [props.event.group.id]);

    return groupServices;
  },
  deleteGroupService: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async serviceId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_services
        WHERE group_id = $1 AND service_id = $2
      `, [props.event.group.id, serviceId]);
    });

    await props.redis.del(props.event.userSub + `group/services`);

    return idsSplit.map(id => ({ id }));
  }
});