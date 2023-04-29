import { useAi } from '@keybittech/wizapp/dist/server';
import { KeycloakAdminClient } from '@keycloak/keycloak-admin-client/lib/client';
import RoleRepresentation, { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import { IDatabase, ITask } from 'pg-promise';
import { RedisClientType } from 'redis';
import { graylog } from 'graylog2';
import { UserGroupRoles } from './profile';
import { IGroupRoleAuthActions } from './group';
import { AnyRecord, Void } from '../util';
import { KcSiteOpts } from './auth';
import fetch from 'node-fetch';

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
export interface SiteApiHandlerRef { }

/**
 * @category API
 */
export const siteApiHandlerRef = {} as SiteApiHandlerRef;

/**
 * @category API
 */
export enum EndpointType {
  QUERY = "query",
  MUTATION = "mutation"
}

/**
 * @category API
 */
export type ApiEvent<T extends AnyRecord> = {
  requestId: string;
  method: string;
  url: string;
  public: boolean;
  username?: string;
  userSub: string;
  sourceIp: string;
  groups?: string[];
  availableUserGroupRoles: UserGroupRoles;
  pathParameters: Record<string, string>;
  queryParameters: Record<string, string>;
  body: T;
}

/**
 * @category API
 */
export type ApiOptions = {
  readonly cache?: 'skip' | number | boolean | null | undefined;
  readonly load?: boolean | undefined;
}

/**
 * @category API
 */
export type ApiFunc<T> = T extends { queryArg: infer QA extends AnyRecord, resultType: infer RT } ? (props: ApiProps<QA>) => Promise<RT extends Void ? void : Partial<RT>> : never;

/**
 * @category API
 */
export type ApiHandler<T> = {
  [K in keyof T]: ApiFunc<T[K]>;
}

/**
 * @category API
 */
export type AiFunctionalities = {
  useAi: typeof useAi
}

/**
 * @category API
 */
export type ApiProps<T extends AnyRecord> = {
  event: ApiEvent<T>;
  db: IDatabase<unknown>;
  fetch: typeof fetch;
  logger: graylog;
  redis: RedisClientType;
  redisProxy: RedisProxy;
  keycloak: KeycloakAdminClient & KcSiteOpts;
  ai: AiFunctionalities;
  tx: ITask<unknown>;
}

/**
 * @category API
 */
export type AuthProps = {
  event: Omit<ApiEvent<AnyRecord>, 'body'> & { body: AuthBody };
  db: IDatabase<unknown>;
  fetch: typeof fetch;
  logger: graylog;
  redis: RedisClientType;
  redisProxy: RedisProxy;
  keycloak: KeycloakAdminClient & KcSiteOpts;
  ai: AiFunctionalities;
  tx: ITask<unknown>;
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

/**
 * @category Redis
 */
export type ProxyKeys = {
  adminSub: string;
  appClient: ClientRepresentation;
  groupRoleActions: Record<string, IGroupRoleAuthActions>;
  groupAdminRoles: RoleMappingPayload[];
  appRoles: RoleRepresentation[];
  roleCall: RoleMappingPayload[];
}

/**
 * @category Redis
 */
export type RedisProxy = (...args: string[]) => Promise<ProxyKeys>;
