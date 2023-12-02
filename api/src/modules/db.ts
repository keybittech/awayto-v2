import { randomUUID } from 'crypto';
import pgPromise from 'pg-promise';
import { Redis } from 'ioredis';


import { IRole, IUserProfile } from 'awayto/core';

export async function initDb(dbClient: ReturnType<ReturnType<typeof pgPromise>>, redisClient: Redis) {

  try {

    await dbClient.connect();

    const pgp = pgPromise();
    const pgTypes = pgp.pg.types;
    pgTypes.setTypeParser(1114, stringValue => stringValue);
    pgTypes.setTypeParser(1082, stringValue => stringValue);

    try {
      // Set admin sub
      const { sub }= await dbClient.one<IUserProfile>(`
        SELECT sub
        FROM dbtable_schema.users
        WHERE username = 'system_owner'
      `);
      await redisClient.set('adminSub', sub);

      const { id: roleId } = await dbClient.one<IRole>(`
        SELECT id
        FROM dbtable_schema.roles
        WHERE name = 'Admin'
      `);
      await redisClient.set('adminRoleId', roleId);
    } catch (error) {
      const sub = randomUUID();
      await dbClient.none(`
        INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
        VALUES ($1::uuid, $2, $3, $1::uuid)
      `, [sub, 'system_owner', new Date()]);
      await redisClient.set('adminSub', sub);
      const { id: roleId } = await dbClient.one<IRole>(`
        INSERT INTO dbtable_schema.roles (name)
        VALUES ($1)
        RETURNING id
      `, ['Admin']);
      await redisClient.set('adminRoleId', roleId);

    }

  } catch (error) {
    console.log({ DB_INIT_ERROR: error })
  }
}
