import postgres, { Client } from 'pg';
import { v4 as uuid } from 'uuid';
import redis from './redis';
import { IUserProfile } from 'awayto';


type BuildParamTypes = string | number | boolean | null;

interface BuildUpdateParams {
  [key: string]: BuildParamTypes;
}

// When postgres retrieves a timestamp or date, it wants to auto convert it to a new Date(). When this happens, it gets double converted to utc because we should be storing dates as utc when they go in usually from the DEFAULT on the table.
postgres.types.setTypeParser(1114, stringValue => stringValue);
postgres.types.setTypeParser(1082, stringValue => stringValue);

const {
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE
} = process.env as { [prop: string]: string } & { PG_PORT: number };

export let connected: boolean = false;
export let db: Client = new postgres.Client({
  host: PG_HOST,
  port: PG_PORT,
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE
});

export const buildUpdate = (params: BuildUpdateParams) => {
  const buildParams: BuildParamTypes[] = [];
  const keySet = Object.keys(params);
  return {
    string: keySet.map((param, index) => `${param} = $${index + 1}`).join(', '),
    array: keySet.reduce((memo, param: BuildParamTypes) => memo.concat(params[param as keyof BuildUpdateParams]), buildParams)
  }
};

async function go() {

  try {
    
    while (false === redis.isReady) {
      console.error('redis is not ready');
      await new Promise<void>(res => setTimeout(() => res(), 250))
    }

    await db.connect();
    
    try {
      // Set admin sub
      const { rows: [{ sub }] } = await db.query<IUserProfile>(`
        SELECT sub
        FROM dbtable_schema.users
        WHERE username = 'system_owner'
      `);

      await redis.set('adminSub', sub);
    
    } catch (error) {
      const sub = uuid();
      await db.query(`
        INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
        VALUES ($1::uuid, $2, $3, $1::uuid)
      `, [sub, 'system_owner', new Date()]);

      await redis.set('adminSub', sub);
    }

    connected = true;
    
  } catch (error) {
    
    console.log({ PGCONNECTERROR: error })

  }
}

void go();