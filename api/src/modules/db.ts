

const reportDbStatus = async () => {
    const tableSelects = [];
    for (const table of dbtable_schema) {
        tableSelects.push(`SELECT '${table.schema}.${table.tableName}' as tablename, COUNT(*) as count FROM ${table.schema}.${table.tableName}`);
    }
    const result = await db.many(tableSelects.join(` UNION ALL `));
    const counts = result.reduce((acc, { tablename, count }) => ({ ...acc, [tablename]: parseInt(count, 10) }), {});
    console.log(`db status: ${JSON.stringify(counts, null, 2)}`);
};

const go = async () => {
    await reportDbStatus();
    setInterval(async () => await reportDbStatus(), CACHE_EXPIRE * 1000);
};

await go();
import { v4 as uuid } from "uuid";
import redis from "./redis";
import { dbtable_schema } from '@app/config';
import { IUserProfile } from "awayto/core";
import pgPromise from "pg-promise";

const { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE } = process.env as {
  [prop: string]: string;
} & { PG_PORT: number };

export let connected: boolean = false;

const pgp = pgPromise();

const pgTypes = pgp.pg.types;
pgTypes.setTypeParser(1114, (stringValue) => stringValue);
pgTypes.setTypeParser(1082, (stringValue) => stringValue);

export const db = pgp({
  host: PG_HOST,
  port: PG_PORT,
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
});
// export let db: Client = new postgres.Client();

async function go() {
  try {
    while (false === redis.isReady) {
      console.error("redis is not ready");
      await new Promise<void>((res) => setTimeout(() => res(), 250));
    }

    await db.connect();
    console.log("db connected");

    try {
      // Set admin sub
      const { sub } = await db.one<IUserProfile>(`
        SELECT sub
        FROM dbtable_schema.users
        WHERE username = 'system_owner'
      `);
      await redis.set("adminSub", sub);
    } catch (error) {
      const sub = uuid();
      await db.none(
        `
        INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
        VALUES ($1::uuid, $2, $3, $1::uuid)
      `,
        [sub, "system_owner", new Date()]
      );

      await redis.set("adminSub", sub);
    }

    connected = true;
  } catch (error) {
    console.log({ PGCONNECTERROR: error });
  }
}


