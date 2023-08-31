import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { fetchBaseQuery, SkipToken } from '@reduxjs/toolkit/dist/query';
import { configureStore, AnyAction, createSlice, Middleware, Reducer, Store, ThunkDispatch } from '@reduxjs/toolkit';
import { createApi, setupListeners } from '@reduxjs/toolkit/query/react';
import { RootState as ApiRootState } from '@reduxjs/toolkit/dist/query/core/apiState';
import { QueryArgFrom, ResultTypeFrom, QueryDefinition, MutationDefinition, QueryLifecycleApi, EndpointDefinitions } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { MutationTrigger, LazyQueryTrigger, UseLazyQueryLastPromiseInfo, UseQuery, UseLazyQuery, UseMutation } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import { ConfirmActionProps, EndpointType, IUtil, RemoveNever, ReplaceVoid, obfuscate, siteApiRef, utilConfig } from 'awayto/core';

export const getQueryAuth = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: headers => {
    const token = localStorage.getItem('kc_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

export type SiteBaseEndpoint = typeof getQueryAuth;
export type SiteQuery<TQueryArg, TResultType> = QueryDefinition<TQueryArg, SiteBaseEndpoint, 'Root', TResultType, 'api'>;
export type SiteMutation<TQueryArg, TResultType> = MutationDefinition<TQueryArg, SiteBaseEndpoint, 'Root', TResultType, 'api'>;
export type SiteEndpointDefinition<T> = T extends { queryArg: infer QA, resultType: infer RT } ? T extends { kind: EndpointType.QUERY } ? SiteQuery<QA, RT> : SiteMutation<QA, RT> : never;

export type { MutationTrigger };
/**
 * The following collection of types tracks a custom set of react hooks which are adapted from the hooks autogenerated by RTK-Query.
 * Some of the base types are directly adapted from, i.e. https://redux-toolkit.js.org/rtk-query/api/created-api/hooks#usequery which should be used as a reference.
 */

type UseQueryOptions<R> = {
  pollingInterval?: number
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
  skip?: boolean
  refetchOnMountOrArgChange?: boolean | number
  selectFromResult?: (result: R) => R
};

type UseLazyQueryOptions<R> = {
  pollingInterval?: number
  refetchOnReconnect?: boolean
  refetchOnFocus?: boolean
  selectFromResult?: (result: R) => R
}

type UseMutationStateOptions<R> = {
  selectFromResult?: (result: R) => R
  fixedCacheKey?: string
}

type CommonHookResult<T> = {
  // Base query state
  originalArgs?: unknown // Arguments passed to the query

  error?: unknown // Error result if present
  requestId?: string // A string generated by RTK Query
  endpointName?: string // The name of the given endpoint for the query

  startedTimeStamp?: number // Timestamp for when the query was initiated
  fulfilledTimeStamp?: number // Timestamp for when the query was completed

  // Derived request status booleans
  isUninitialized: boolean // Query has not started yet.
  isLoading: boolean // Query is currently loading for the first time. No data yet.
  isFetching: boolean // Query is currently fetching, but might have data from an earlier request.
  isSuccess: boolean // Query has data from a successful load.
  isError: boolean // Query is currently in an "error" state.
} & T extends unknown[] ? { data: T } : { data: Partial<T> };


type UseQueryResult<T> = CommonHookResult<T> & {
  currentData: T
  refetch: () => void
};

type UseLazyQueryResult<T> = CommonHookResult<T> & {
  currentData: T;
};

type UseMutationResult<T> = CommonHookResult<T> & {
  reset: () => void
};

export type CustomUseQuery<D extends QueryDefinition<QueryArgFrom<D>, SiteBaseEndpoint, 'Root', ResultTypeFrom<D>, 'api'>> = (
  arg: QueryArgFrom<D> | SkipToken,
  options?: UseQueryOptions<ResultTypeFrom<D>>
) => UseQueryResult<ResultTypeFrom<D>>;

export type CustomUseLazyQuery<D extends QueryDefinition<QueryArgFrom<D>, SiteBaseEndpoint, 'Root', ResultTypeFrom<D>, 'api'>> = (
  options?: UseLazyQueryOptions<ResultTypeFrom<D>>
) => [
  LazyQueryTrigger<D>, 
  UseLazyQueryResult<ResultTypeFrom<D>>, 
  UseLazyQueryLastPromiseInfo<D>
];

export type CustomUseMutation<D extends MutationDefinition<QueryArgFrom<D>, SiteBaseEndpoint, 'Root', ResultTypeFrom<D>, 'api'>> = (
  options?: UseMutationStateOptions<ResultTypeFrom<D>>
) => [
  MutationTrigger<D>, 
  UseMutationResult<ResultTypeFrom<D>>
];

type QueryKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.QUERY }
  ? `use${Capitalize<string & K>}Query`
  : never;
}[keyof T];

type LazyQueryKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.QUERY }
  ? `useLazy${Capitalize<string & K>}Query`
  : never;
}[keyof T];

type MutationKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.MUTATION }
  ? `use${Capitalize<string & K>}Mutation`
  : never;
}[keyof T];

type EndpointInfo<T> = {
  [K in QueryKeys<T>]: K extends `use${infer U}Query`
  ? Uncapitalize<U> extends keyof T ? UseQuery<
    SiteQuery<
      ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
      ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
    >
  > : never
  : never;
} & {
    [K in LazyQueryKeys<T>]: K extends `useLazy${infer U}Query`
    ? Uncapitalize<U> extends keyof T ? UseLazyQuery<
      SiteQuery<
        ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
        ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
      >
    > : never
    : never;
  } & {
    [K in MutationKeys<T>]: K extends `use${infer U}Mutation`
    ? Uncapitalize<U> extends keyof T ? UseMutation<
      SiteMutation<
        ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
        ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
      >
    > : never
    : never;
  };

type EndpointQuery<T> = (args: T) => string | { url: string; method: string; body: T };

export type SiteEndpointDefinitions = {
  [K in keyof typeof siteApiRef]: typeof siteApiRef[K] extends { queryArg: infer QA, resultType: infer RT } ? 
    typeof siteApiRef[K] extends { kind: EndpointType.MUTATION } ? 
      MutationDefinition<QA, SiteBaseEndpoint, string, RT, string> : 
      QueryDefinition<QA | void, SiteBaseEndpoint, string, RT, string> : 
    never;
};

export const utilSlice = createSlice(utilConfig);

let currentlyLoading = 0;

// Store Hooks
export const sh = createApi({
  baseQuery: getQueryAuth,
  endpoints: builder => Object.keys(siteApiRef).reduce<EndpointDefinitions>((m, endpointName) => {
    const endpointKey = endpointName as keyof typeof siteApiRef;
    type BuiltEndpoint = typeof siteApiRef[typeof endpointKey];

    const ep = siteApiRef[endpointName as keyof typeof siteApiRef] as BuiltEndpoint;
    const { method, queryArg, resultType, url, opts } = ep;
  
    const kind = ep.kind as EndpointType;
  
    type EPQueryArg = typeof queryArg;
    type EPResultType = typeof resultType;

    const builderPayload: {
      query: EndpointQuery<EPQueryArg>;
      onQueryStarted(arg: EPQueryArg, { queryFulfilled }: Pick<QueryLifecycleApi<EPQueryArg, SiteBaseEndpoint, typeof resultType>, 'queryFulfilled'>): Promise<void>;
    } = {
      query: ((args: EPQueryArg) => {
        const processedUrl = url.replace(/:(\w+)/g, (_, key) => args[key as keyof EPQueryArg]);
        if (kind === EndpointType.QUERY) {
          return processedUrl;
        }

        return {
          url: processedUrl,
          method,
          headers: opts.contentType ? {
            'Content-Type': opts.contentType,
            'Content-Length': 'application/octet-stream' === opts.contentType ? (args as ArrayBuffer).byteLength.toString() : undefined
          } : undefined,
          body: args
        };
      }),
      onQueryStarted: async (qa, { queryFulfilled }) => {
        if (opts.load || kind === EndpointType.MUTATION) {
          if (currentlyLoading === 0) {
            store.dispatch(utilSlice.actions.setLoading({ isLoading: true }));
          }
          currentlyLoading++;
  
          try {
            await queryFulfilled;
          } catch { }
  
          setTimeout(() => {
            currentlyLoading--;
            if (currentlyLoading === 0) {
              store.dispatch(utilSlice.actions.setLoading({ isLoading: false }));
            }
          }, 0);
        }
      }
    };
  
    return {
      ...m,
      [endpointName]: kind === EndpointType.QUERY ?
        builder.query<EPResultType, EPQueryArg>(builderPayload) :
        builder.mutation<EPResultType, EPQueryArg>(builderPayload),
    };
  }, {} as EndpointDefinitions)
}) as RemoveNever<EndpointInfo<typeof siteApiRef>> & ReturnType<typeof createApi>;

console.log({ loadedup: Object.keys(sh) });

export const customErrorMiddleware: Middleware = storeApi => next => (action: { type: string, payload: { data: { reason: string } } }) => {
  if (action.type.endsWith('/rejected')) {
    const { data } = action.payload;

    if (data && data.reason) {
      storeApi.dispatch(utilSlice.actions.setSnack({ snackOn: data.reason, snackType: 'error' }));
    }
  }

  return next(action);
};

export type ConfirmActionType = (...props: ConfirmActionProps) => void | Promise<void>;
export type ActionRegistry = Record<string, ConfirmActionType>;
const actionRegistry: ActionRegistry = {};

function registerAction(id: string, action: ConfirmActionType): void {
  actionRegistry[id] = action;
}

export function getUtilRegisteredAction(id: string): ConfirmActionType {
  return actionRegistry[id];
}

// eslint-disable-next-line
const customUtilMiddleware: Middleware = _ => next => (action: { type: string, payload: Partial<IUtil> }) => {
  if (action.type.includes('openConfirm')) {
    const { confirmEffect, confirmAction } = action.payload;
    if (confirmEffect && confirmAction) {
      registerAction(obfuscate(confirmEffect), confirmAction)
      action.payload.confirmAction = undefined;
    }
  }

  return next(action);
}

const middlewares = [
  sh.middleware as Middleware,
  customErrorMiddleware,
  customUtilMiddleware,
  thunk
];

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({
    collapsed: (getState, action, logEntry) => !logEntry?.error
  })
  middlewares.push(logger);
}

export const store = configureStore({
  reducer: {
    [sh.reducerPath]: sh.reducer as Reducer,
    util: utilSlice.reducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(middlewares)
});

setupListeners(store.dispatch);

/**
* @category Awayto Redux
*/
export type AppDispatch = typeof store.dispatch;

/**
* @category Awayto Redux
*/
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
* @category Awayto Redux
*/
export interface RootState extends ReturnType<typeof store.getState>, ApiRootState<SiteEndpointDefinitions, 'Root', 'api'> { }

/**
* @category Awayto Redux
*/
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
* @category Awayto Redux
*/
export type ThunkStore = Store<RootState, AnyAction> & {
  dispatch: ThunkDispatch<RootState, undefined, AnyAction>;
}

declare global {
  interface IProps {
    store?: ThunkStore;
  }
}