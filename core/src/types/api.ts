import type { useAi } from '@keybittech/wizapp/dist/server';
import type { KeycloakAdminClient } from '@keycloak/keycloak-admin-client/lib/client';
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import type { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import type ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import type { IDatabase, ITask } from 'pg-promise';
import type { RedisClientType } from 'redis';
import type { graylog } from 'graylog2';
import type { Dayjs } from 'dayjs';

import { UserGroupRoles } from './profile';
import { IGroup, IGroupRoleAuthActions } from './group';
import { AnyRecord, AnyRecordTypes, Void } from '../util';
import { KcSiteOpts } from './auth';
import fetch from 'node-fetch';

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
export type ApiEvent<T extends AnyRecord | AnyRecordTypes> = {
  requestId: string;
  method: string;
  url: string;
  public: boolean;
  userSub: string;
  sourceIp: string;
  group: Partial<IGroup>;
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
  readonly throttle?: 'skip' | number | undefined;
  readonly contentType?: string | undefined;
}

export type HttpMethodsLC = 'get' | 'post' | 'put' | 'delete';

/**
 * @category API
 */
export type ApiFunc<T> = T extends { queryArg: infer QA extends AnyRecord | AnyRecordTypes, resultType: infer RT } ? (props: ApiProps<QA>) => Promise<RT extends Void ? void : Partial<RT>> : never;

/**
 * @category API
 */
export type ApiHandler<T> = {
  [K in keyof T]: ApiFunc<T[K]>;
}

export type ApiDefinition = {
  kind: EndpointType;
  url: string;
  method: string;
  opts: ApiOptions;
  queryArg: AnyRecord | Readonly<AnyRecordTypes>;
  resultType: AnyRecord | Readonly<AnyRecordTypes>;
};

export type ApiMap = Record<string, ApiDefinition>;

export type SaveFileProps = {
  id: string;
  name: string;
  expiration: Dayjs;
};

export type BufferResponse = {
  url: string;
  name: string;
  buffer: ArrayBuffer;
};

export type FsFunctionalities = {
  saveFile: (buffer: ArrayBuffer) => Promise<string | undefined>;
  putFile: (props: SaveFileProps) => Promise<void>;
  getFile: (id: string) => Promise<Partial<BufferResponse>>;
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
export type ApiProps<T extends AnyRecord | AnyRecordTypes> = {
  event: ApiEvent<T>;
  db: IDatabase<unknown>;
  fetch: typeof fetch;
  logger: graylog;
  redis: RedisClientType;
  redisProxy: RedisProxy;
  keycloak: KeycloakAdminClient & KcSiteOpts;
  fs: FsFunctionalities;
  ai: AiFunctionalities;
  tx: ITask<unknown>;
}

/**
 * @category API
 */
export type IWebhooks = {
  [prop: string]: (props: ApiProps<AuthBody>) => Promise<void>;
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
  schema: string;
  table: string;
  column: string;
  dataType: string;
  constraint: string;
  received: number;
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
  adminRoleId: string;
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
