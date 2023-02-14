import { Client } from 'pg';
import { ILoadedState, UserGroupRoles } from 'awayto';

/**
 * @category API
 */
export type ApiModule = ApiModulet[];

/**
 * @category API
 */
export type ApiModulet = {
  roles?: string;
  inclusive?: boolean;
  method: string;
  path: string;
  cmnd(props: ApiProps, meta?: string): Promise<ILoadedState | ILoadedState[] | boolean>;
}

export type AuthEvent = {
  id: string;
  clientId: string;
  realmId: string;
  ipAddress: string;
  sessionId: string;
  userId: string;
  time: string;
  type: string;
  details: Record<string, string>
};

export type IWebhooks = {
  [prop: string]: (event: ApiProps) => Promise<void>;
};


/**
 * @category API
 */
export type ApiProps = {
  event: {
    method: string;
    path: string;
    public: boolean;
    username?: string;
    userSub?: string;
    sourceIp: string;
    groups?: string[];
    groupRoles: UserGroupRoles;
    pathParameters: Record<string, string>,
    queryParameters: Record<string, string>,
    body: Array<ILoadedState> | Record<string, unknown> | AuthEvent
  };
  client: Client; 
}

/**
 * @category API
 */
export type ApiRequestAuthorizer = {
  userToken: string;
  roles: string;
  inclusive: boolean;
}

type BuildParamTypes = string | number | boolean;

interface BuildUpdateParams {
  [key: string]: BuildParamTypes;
}

export const buildUpdate = (params: BuildUpdateParams) => {
  const buildParams: BuildParamTypes[] = [];
  
  return {
    string: Object.keys(params).map((param, index) => `${param} = $${index + 1}`).join(', '),
    array: Object.keys(params).reduce((memo, param: BuildParamTypes) => memo.concat(params[param as keyof BuildUpdateParams]), buildParams)
  }
};

export async function asyncForEach<T>(array: T[], callback: (item: T, idx: number, arr: T[]) => Promise<void>) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}