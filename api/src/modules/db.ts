import { v4 as uuid } from 'uuid';
import redis from './redis';
import { IUserProfile } from 'awayto/core';
import pgPromise from 'pg-promise';

const {
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE
} = process.env as { [prop: string]: string } & { PG_PORT: number };

const pgp = pgPromise();

const pgTypes = pgp.pg.types;
pgTypes.setTypeParser(1114, stringValue => stringValue);
pgTypes.setTypeParser(1082, stringValue => stringValue);

export const db = pgp({
  host: PG_HOST,
  port: PG_PORT,
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE
})
// export let db: Client = new postgres.Client();

export async function connect() {

  try {

    await db.connect();

    try {
      // Set admin sub
      const { sub }= await db.one<IUserProfile>(`
        SELECT sub
        FROM dbtable_schema.users
        WHERE username = 'system_owner'
      `);
      await redis.set('adminSub', sub);
    } catch (error) {
      const sub = uuid();
      await db.none(`
        INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
        VALUES ($1::uuid, $2, $3, $1::uuid)
      `, [sub, 'system_owner', new Date()]);

      await redis.set('adminSub', sub);
    }

  } catch (error) {

    console.log({ PGCONNECTERROR: error })

  }
}