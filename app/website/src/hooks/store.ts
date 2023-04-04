import createDebounce from 'redux-debounced';
import logger from 'redux-logger';
import thunk, { ThunkAction } from 'redux-thunk';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { fetchBaseQuery } from '@reduxjs/toolkit/dist/query';
import { configureStore, AnyAction, combineReducers, createSlice, Middleware, Reducer, Store, ThunkDispatch } from '@reduxjs/toolkit';
import { createApi, EndpointDefinitions, setupListeners } from '@reduxjs/toolkit/query/react';

import { MutationActionCreatorResult, QueryActionCreatorResult } from '@reduxjs/toolkit/dist/query/core/buildInitiate';
import { ApiEndpointMutation, ApiEndpointQuery } from '@reduxjs/toolkit/dist/query/core/module';
import { QueryDefinition, MutationDefinition } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { UseLazyQuery, UseMutation, UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import { AppState, EndpointType, ReplaceVoid, siteApiRef, SiteApiRef, utilConfig, Void } from 'awayto/core';

import build from '../build.json';

const { reducers: builtReducers } = build as Record<string, Record<string, string>>; // { "util": "/path/to/util", "profile": "/path/to/profile" }

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
// Generally used API types for @reduxjs/toolkit as used within this application
export type SiteBaseEndpoint = typeof getQueryAuth;
export type SiteApiQuery = QueryDefinition<void, SiteBaseEndpoint, 'Root', unknown, 'api'>;
export type SiteQuery<TQueryArg, TResultType> = QueryDefinition<TQueryArg, SiteBaseEndpoint, 'Root', TResultType, 'api'>;
export type SiteApiMutation = MutationDefinition<void, SiteBaseEndpoint, 'Root', unknown, 'api'>;
export type SiteMutation<TQueryArg, TResultType> = MutationDefinition<TQueryArg, SiteBaseEndpoint, 'Root', TResultType, 'api'>;

type QueryKeys<T> = {
  [K in keyof T]: T[K] extends { kind: EndpointType.QUERY }
  ? `use${Capitalize<string & K>}Query` | `useLazy${Capitalize<string & K>}Query`
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
  : K extends `useLazy${infer U}Query`
  ? Uncapitalize<U> extends keyof T ? UseLazyQuery<
    SiteQuery<
      ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
      ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
    >
  > : never
  : never;
} &
  {
    [K in MutationKeys<T>]: K extends `use${infer U}Mutation`
    ? Uncapitalize<U> extends keyof T ? UseMutation<
      SiteMutation<
        ReplaceVoid<Extract<T[Uncapitalize<U>], { queryArg: unknown }>['queryArg']>,
        ReplaceVoid<Extract<T[Uncapitalize<U>], { resultType: unknown }>['resultType']>
      >
    > : never
    : never;
  };

// Following types help determine available rtk-query createApi endpoint action initiators
// Beware that this is referring to storeApi.endpoints, not siteApiRef.endpoints
export type ApiEndpointActions = (
  ApiEndpointQuery<SiteApiQuery, (void | unknown) & EndpointDefinitions> |
  ApiEndpointMutation<SiteApiMutation, (void | unknown) & EndpointDefinitions>
)['initiate'];

export type DispatchableApiEndpointAction<T extends ApiEndpointActions> = (...params: Parameters<T>) =>
  QueryActionCreatorResult<SiteApiQuery> | MutationActionCreatorResult<SiteApiMutation>
export type LoadedDispatchableApiEndpointActions = DispatchableApiEndpointAction<ApiEndpointActions>;

export type InitiatorThunk = ThunkAction<QueryActionCreatorResult<SiteApiQuery>, RootState, unknown, AnyAction> & ThunkAction<MutationActionCreatorResult<SiteApiMutation>, RootState, unknown, AnyAction>
export type EndpointDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

export const loadEndpointRequests: string[] = [];
const endpointsLoaded: Map<string, boolean> = new Map();
export async function loadEndpoint(moduleName: string): Promise<void> {
  if (!endpointsLoaded.has(moduleName)) {
    await import(`../modules/${builtReducers[moduleName]}`);
    endpointsLoaded.set(moduleName, true);
  }
}

export function getModuleEndpoint<T>(endpoints: ReturnType<typeof createApi>['endpoints']) {
  return endpoints as {
    [K in keyof typeof endpoints]: (ApiEndpointQuery<SiteApiQuery, T & EndpointDefinitions> | ApiEndpointMutation<SiteApiMutation, T & EndpointDefinitions>)
  }
}

// The following types help determing available slice actions from standard @reduxjs/toolkit
export interface LoadedSlices { }
export const loadedSlices: Record<string, ReturnType<typeof createSlice>> = {};
export const loadSliceRequests: string[] = [];
type SliceActions = typeof loadedSlices[string]['actions'][string];
type DispatchableSliceAction<T extends SliceActions> = (...params: Parameters<T>) => AnyAction
export type LoadedDispatchableSliceActions = DispatchableSliceAction<SliceActions>;
export async function loadSlice(moduleName: string): Promise<void> {
  if (!loadedSlices[moduleName]) {
    loadedSlices[moduleName] = (await import(`../modules/${builtReducers[moduleName]}`) as { default: ReturnType<typeof createSlice> }).default;
    loadedReducers[moduleName] = loadedSlices[moduleName].reducer;
    store.replaceReducer(combineReducers(loadedReducers) as Reducer);
  }
}

// export const storeApi = createApi({
//   baseQuery: getQueryAuth,
//   endpoints: builder => Object.keys(siteApiRef).reduce((m, endpointName) => {
//     const endpointKey = endpointName as keyof SiteApiRef;
//     type BuiltEndpoint = typeof siteApiRef[typeof endpointKey];
//     const { method, queryArg, resultType, kind, url } = siteApiRef[endpointName as keyof SiteApiRef] as BuiltEndpoint;
//     const { transformResponse } = siteApiRef[endpointName as keyof SiteApiRef] as BuiltEndpoint & { transformResponse: undefined | (prop: typeof resultType) => typeof resultType };
//     const builderPayload = {
//       transformResponse,
//       query: (args: typeof queryArg) => {
//         const processedUrl = url.replace(/:(\w+)/g, (_, key) => args[key as keyof typeof queryArg]);
//         if (kind === EndpointType.QUERY) {
//           return processedUrl;
//         }
//         return { url: processedUrl, method, body: args };
//       }
//     } as const;

//     return {
//       ...m,
//       [endpointName]: kind === EndpointType.QUERY ?
//         builder.query<typeof resultType, typeof queryArg>(builderPayload) :
//         builder.mutation<typeof resultType, typeof queryArg>(builderPayload),
//     };
//   }, {})
// }) as EndpointInfo<SiteApiRef> & ReturnType<typeof createApi>;

export const storeApi = createApi({
  baseQuery: getQueryAuth,
  endpoints: builder => Object.keys(siteApiRef).reduce((m, endpointName) => {
    const endpointKey = endpointName as keyof SiteApiRef;
    type BuiltEndpoint = typeof siteApiRef[typeof endpointKey];
    const { method, queryArg, resultType, kind, url, transformResponse } = siteApiRef[endpointName as keyof SiteApiRef] as BuiltEndpoint & Partial<{ transformResponse: (response: unknown) => unknown }>;
    const builderPayload: (typeof transformResponse extends (response: unknown) => unknown ? { transformResponse: typeof transformResponse } : Record<string, unknown>) & {
      query: (args: typeof queryArg) => string | { url: string; method: string; body: typeof queryArg };
    } = {
      query: (args: typeof queryArg) => {
        const processedUrl = url.replace(/:(\w+)/g, (_, key) => args[key as keyof typeof queryArg]);
        if (kind === EndpointType.QUERY) {
          return processedUrl;
        }
        return { url: processedUrl, method, body: args };
      },
      ...(transformResponse ? { transformResponse } : {}),
    };

    return {
      ...m,
      [endpointName]: kind === EndpointType.QUERY ?
        builder.query<typeof resultType, typeof queryArg>(builderPayload) :
        builder.mutation<typeof resultType, typeof queryArg>(builderPayload),
    };
  }, {})
}) as EndpointInfo<SiteApiRef> & ReturnType<typeof createApi>;


export type SiteEndpointInfo = EndpointInfo<SiteApiRef>;




export const utilSlice = createSlice(utilConfig);




export const loadedReducers = {
  [storeApi.reducerPath]: storeApi.reducer,
  util: utilSlice.reducer
} as Record<string, Reducer>;

export const store = configureStore({
  reducer: loadedReducers,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(
    storeApi.middleware as Middleware,
    createDebounce(),
    thunk,
    logger
  )
});

setupListeners(store.dispatch);

export interface RootState extends AppState, ReturnType<typeof store.getState> {}
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = LoadedDispatchableApiEndpointActions> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
export const useAppDispatch: () => AppDispatch = useDispatch;
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