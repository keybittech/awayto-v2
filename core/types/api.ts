import { Client as PGClient } from 'pg';
import { RedisClientType } from 'redis';
import { IActionTypes } from './action_types';
import { UserGroupRoles } from './profile';

import { IDatabase } from 'pg-promise';

declare global {
  /**
   * @category API
   */
  export interface IMergedState { }
}

/**
 * @category API
 */
export interface SiteApiRef { }

/**
 * @category API
 */
export const siteApiRef = {} as SiteApiRef;

/**
 * @category API
 */
export type ExtendApi<T> = { [K in keyof T]: T[K] };

/**
 * @category API
 */
export enum EndpointType {
  QUERY = "query",
  MUTATION = "mutation"
}

// Following types are used to determine available @reduxjs/toolkit auto generated hooks
export type Void = { _void: never };
export type ReplaceVoid<T> = T extends Void ? void : T;

/**
 * @category API
 */
export type ApiHandler<
  TBody extends undefined | Record<string, string | number | boolean | Record<string, unknown> | unknown[]> = undefined,
  TPathParams extends undefined | Record<string, string> = undefined,
  TQueryParams extends undefined | Record<string, string> = undefined
> = {
  event: ApiEvent<TBody, TPathParams, TQueryParams>;
  db: IDatabase<unknown>;
  redis: RedisClientType;
}

/**
 * @category API
 */
export type ApiEvent<T = IMergedState & Error, P = Record<string, string>, Q = Record<string, string>> = {
  requestId: string;
  method: string;
  path: string;
  public: boolean;
  username?: string;
  userSub: string;
  sourceIp: string;
  groups?: string[];
  availableUserGroupRoles: UserGroupRoles;
  pathParameters: P,
  queryParameters: Q,
  body: T
}

/**
 * @category API
 */
export type ApiProps<T> = {
  event: ApiEvent<T>;
  db: IDatabase<unknown>;
  redis: RedisClientType;
}

/**
 * @category API
 */
export type AuthProps = {
  event: Omit<ApiEvent, 'body'> & { body: AuthBody };
  db: IDatabase<unknown>;
  redis: RedisClientType;
}

/**
 * @category API
 */
export type IWebhooks = {
  [prop: string]: (event: AuthProps) => Promise<void>;
};

/**
 * @category API
 */
export type ApiModule = ApiModulet[];

/**
 * @category Awayto
 */
export class ApiResponse {
  responseText?: string;
  responseString?: string;
  responseBody?: Response;
}

/**
 * @category Awayto
 */
export interface ApiResponseBody extends IMergedState {
  error: Error | string;
  type: string;
  message: string;
  statusCode: number;
  requestId: string;
}

/**
 * @category API
 */
export type ApiModulet = {
  roles?: string;
  inclusive?: boolean;
  cache?: 'skip' | number | null;
  action: IActionTypes;
  cmnd(props: ApiProps<Record<string, string>>, meta?: string): Promise<Partial<ApiResponseBody>>;
}

/**
 * @category API
 */
export type AuthBody = {
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

/**
 * @category API
 */
export type DbError = Error & {
  schema: string,
  table: string,
  column: string,
  dataType: string,
  constraint: string
};

/**
 * @category API
 */
export type ApiErrorResponse = Partial<Error> & {
  [prop: string]: unknown;
  requestId: string;
  reason?: string;
};

/**
 * @category API
 */
export type ApiInternalError = Error & {
  response: {
    status: number
  };
  data: {
    errorMessage: string;
  };
};

/**
 * @category API
 */
export class ErrorType extends Error {
  constructor(message?: string & unknown) {
    super(message); 
    Object.setPrototypeOf(this, new.target.prototype);
  }
}


/**
 * @category API
 */
type BuildParamTypes = string | number | boolean | null;


/**
 * @category API
 */
interface BuildUpdateParams {
  [key: string]: BuildParamTypes;
}

/**
 * @category API
 */
export const buildUpdate = (params: BuildUpdateParams) => {
  const buildParams: BuildParamTypes[] = [];
  const keySet = Object.keys(params);
  return {
    string: keySet.map((param, index) => `${param} = $${index + 1}`).join(', '),
    array: keySet.reduce((memo, param: BuildParamTypes) => memo.concat(params[param as keyof BuildUpdateParams]), buildParams)
  }
};