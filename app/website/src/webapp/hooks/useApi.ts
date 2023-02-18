import { useCallback } from 'react';
// import { HttpResponse } from '@aws-sdk/types';
import routeMatch, { RouteMatch } from 'route-match';

import {
  IActionTypes,
  IUtilActionTypes,
  IFilesActionTypes,
  IScheduleActionTypes,
  IServiceActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes,
  IGroupActionTypes,
  IGroupServiceActionTypes,
  IGroupServiceAddonActionTypes,
  IGroupScheduleActionTypes,
  IRoleActionTypes,
  IUserActionTypes,
  ApiErrorResponse,
  ILoadedState,
  IServiceAddonActionTypes,
  IAssistActionTypes
} from 'awayto';

import { useAct } from './useAct';

import keycloak from '../keycloak';

export function registerApi(api: IActionTypes): void {
  ApiActions = Object.assign(ApiActions, api);
}

let ApiActions = Object.assign(
  IFilesActionTypes,
  IScheduleActionTypes,
  IServiceActionTypes,
  IServiceAddonActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes,
  IGroupActionTypes,
  IGroupServiceActionTypes,
  IGroupServiceAddonActionTypes,
  IGroupScheduleActionTypes,
  IRoleActionTypes,
  IUserActionTypes,
  IAssistActionTypes
) as Record<string, string>;

const { Route, RouteCollection, PathGenerator } = routeMatch as RouteMatch;

const paths = Object.keys(ApiActions).map(key => {
  return new Route(key, ApiActions[key])
});

const routeCollection = new RouteCollection(paths);
const generator = new PathGenerator(routeCollection);

const { SET_LOADING, API_SUCCESS, SET_SNACK } = IUtilActionTypes;


/**
 * The `useApi` hook provides type-bound api functionality. By passing in a {@link IActionTypes} we can control the structure of the api request, and more easily handle it on the backend.
 * 
 * ```
 * import { useApi, IManageUsersActions } from 'awayto';
 * 
 * const { GET_MANAGE_USERS, GET_MANAGE_USERS_BY_ID } = IManageUsersActions;
 * 
 * const api = useApi();
 * 
 * api(GET_MANAGE_USERS);
 * ```
 * 
 * As long as we have setup our model, `GET_MANAGE_USERS` will inform the system of the API endpoint and shape of the request/response.
 * 
 * If the endpoint takes path parameters, we can pass them in as options. Pass a boolean as the second argument to show or hide a loading screen.
 *
 * ```
 * api(GET_MANAGE_USERS_BY_ID, false, { id });
 * ```
 * 
 * @category Hooks
 */


export function useApi(): <T = unknown, R = ILoadedState>(actionType: IActionTypes, load?: boolean, body?: Partial<T>, meta?: unknown) => [(reason?: string)=> void, Promise<void | R> | undefined] {
  const act = useAct();

  const api = useCallback(<T = unknown, R = ILoadedState>(actionType: IActionTypes, load?: boolean, body?: Partial<T>, meta?: unknown): [(reason?: string)=> void, Promise<void | R> | undefined] => {

    const abortController: AbortController = new AbortController();
    function abort(reason?: string) {
      abortController.abort(reason);
    }

    try {

      if (load) act(SET_LOADING, { isLoading: true });

      const methodAndPath = actionType.valueOf().split(/\/(.+)/);
      const method = methodAndPath[0];
      let path = methodAndPath[1];

      let jsonBody: string | undefined = JSON.stringify(body);

      if (path.includes('/:')) {
        // Get the key of the enum from ApiActions based on the path (actionType)
        const pathKey = Object.keys(ApiActions).filter((x) => ApiActions[x] == actionType)[0];
        path = generator.generate(pathKey, body as Record<string, string>).split(/\/(.+)/)[1];
      }

      if (['delete', 'get'].indexOf(method.toLowerCase()) > -1 && body) {
        jsonBody = undefined;
      }

      const response = fetch(`/api/${path}`, {
        signal: abortController.signal,
        method,
        body: jsonBody,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token as string}`
        }
      })
      .then(async res => {
        if (!res.ok) throw await res.json();
        return res.json()
      })
      .then((data: R) => {
        act(actionType || API_SUCCESS, data as ILoadedState, meta);
        if (load) act(SET_LOADING, { isLoading: false });
        return data;
      })
      .catch(err => {
        const { name, requestId, reason } = err as ApiErrorResponse;

        if (['AbortError'].includes(name as string)) return;

        act(SET_SNACK, {
          snackRequestId: requestId,
          snackType: 'error',
          snackOn: 'Error: ' + (reason ? reason : 'Internal service error. You can report this if needed.')
        });
        
        if (load) act(SET_LOADING, { isLoading: false });
      });

      return [abort, response];
    } catch (error) {
      console.error('Failed to parse preflight', error);
      if (load) act(SET_LOADING, { isLoading: false });
      return [abort, undefined];
    }
  }, []);

  return api;
}
