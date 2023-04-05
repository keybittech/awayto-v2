import createDebounce from 'redux-debounced';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { fetchBaseQuery } from '@reduxjs/toolkit/dist/query';
import { configureStore, AnyAction, createSlice, Middleware, Reducer, Store, ThunkDispatch } from '@reduxjs/toolkit';
import { createApi, setupListeners } from '@reduxjs/toolkit/query/react';

import { QueryDefinition, MutationDefinition } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { UseLazyQuery, UseMutation, UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import { EndpointType, ReplaceVoid, siteApiRef, SiteApiRef, utilConfig } from 'awayto/core';

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

export const utilSlice = createSlice(utilConfig);

export const store = configureStore({
  reducer: {
    [storeApi.reducerPath]: storeApi.reducer as Reducer,
    util: utilSlice.reducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(
    storeApi.middleware as Middleware,
    createDebounce(),
    thunk,
    logger
  )
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
export interface RootState extends ReturnType<typeof store.getState> {}

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