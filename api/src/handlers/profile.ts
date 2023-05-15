import { IUserProfile, buildUpdate, utcNowString, createHandlers, IGroup } from 'awayto/core';

export default createHandlers({
  postUserProfile: async props => {
    const { firstName, lastName, username, email, image, sub } = props.event.body;

    const user = await props.tx.one<IUserProfile>(`
      INSERT INTO dbtable_schema.users (sub, username, first_name, last_name, email, image, created_on, created_sub, ip_address)
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::uuid, $9)
    `, [sub || props.event.userSub, username, firstName, lastName, email, image, utcNowString(), props.event.userSub, props.event.sourceIp]);

    return { success: true };
  },
  putUserProfile: async props => {
    const { id, firstName: first_name, lastName: last_name, email, image } = props.event.body;

    const updateProps = buildUpdate({
      id,
      first_name,
      last_name,
      email,
      image,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    const user = await props.tx.one<IUserProfile>(`
      UPDATE dbtable_schema.users
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, first_name as "firstName", last_name as "lastName", email, image
    `, updateProps.array);

    try {
      await props.keycloak.users.update({
        id: props.event.userSub
      }, {
        firstName: first_name,
        lastName: last_name
      })
    } catch (error) { }

    await props.redis.del(props.event.userSub + 'profile/details');

    return user;
  },
  getUserProfileDetails: async props => {
    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const profile = await props.db.one<IUserProfile>(`
      SELECT * 
      FROM dbview_schema.enabled_users_ext
      WHERE sub = $1
    `, [props.event.userSub]);

    for (const group of Object.values(profile.groups)) {
      if (group.ldr) {
        const groupExt = await props.db.one<IGroup>(`
          SELECT * 
          FROM dbview_schema.enabled_groups_ext
          WHERE id = $1
        `, [group.id]);

        Object.assign(group, groupExt);
      }
    }

    profile.availableUserGroupRoles = props.event.availableUserGroupRoles;

    try {
      await props.keycloak.users.delClientRoleMappings({
        id: profile.sub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });
    } catch (error) { }

    return profile;
  },
  getUserProfileDetailsBySub: async props => {
    const { sub } = props.event.pathParameters;

    const profile = await props.db.one<IUserProfile>(`
      SELECT * FROM dbview_schema.enabled_users
      WHERE sub = $1 
    `, [sub]);

    return profile;
  },
  getUserProfileDetailsById: async props => {
    const { id } = props.event.pathParameters;

    const profile = await props.db.one<IUserProfile>(`
      SELECT * FROM dbview_schema.enabled_users
      WHERE id = $1 
    `, [id]);

    return profile;
  },
  disableUserProfile: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.users
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  }
});