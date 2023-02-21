import postgres, { Client } from 'pg';

type BuildParamTypes = string | number | boolean;

interface BuildUpdateParams {
  [key: string]: BuildParamTypes;
}

// When postgres retrieves a timestamp, it wants to auto convert it to a new Date(). When this happens, it gets double converted to utc because we should be storing dates as utc when they go in usually from the DEFAULT on the table.
postgres.types.setTypeParser(1114, stringValue => stringValue);

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
  
  return {
    string: Object.keys(params).map((param, index) => `${param} = $${index + 1}`).join(', '),
    array: Object.keys(params).reduce((memo, param: BuildParamTypes) => memo.concat(params[param as keyof BuildUpdateParams]), buildParams)
  }
};

async function go() {

  try {
      
    await db.connect();
    
    connected = true;
    
  } catch (error) {
    
    console.log({ PGCONNECTERROR: error })

  }
}

void go();