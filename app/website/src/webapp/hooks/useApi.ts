import { useCallback } from 'react';
// import { HttpResponse } from '@aws-sdk/types';
import routeMatch, { RouteMatch } from 'route-match';

import {
  IActionTypes,
  IUtilActionTypes,
  IFilesActionTypes,
  IScheduleActionTypes,
  IScheduleContextActionTypes,
  IServiceActionTypes,
  IServiceAddonActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes,
  IGroupActionTypes,
  IRoleActionTypes,
  IUserActionTypes,
  ApiErrorResponse,
  ILoadedState
} from 'awayto';

import { useAct } from './useAct';

import keycloak from '../keycloak';

export function registerApi(api: IActionTypes): void {
  ApiActions = Object.assign(ApiActions, api);
}

let ApiActions = Object.assign(
  IFilesActionTypes,
  IScheduleActionTypes,
  IScheduleContextActionTypes,
  IServiceActionTypes,
  IServiceAddonActionTypes,
  IManageUsersActionTypes,
  IManageGroupsActionTypes,
  IManageRolesActionTypes,
  IUserProfileActionTypes,
  IGroupActionTypes,
  IRoleActionTypes,
  IUserActionTypes
) as Record<string, string>;

const { Route, RouteCollection, PathGenerator } = routeMatch as RouteMatch;

const paths = Object.keys(ApiActions).map(key => {
  return new Route(key, ApiActions[key])
});

const routeCollection = new RouteCollection(paths);
const generator = new PathGenerator(routeCollection);

const { START_LOADING, API_SUCCESS, STOP_LOADING, SET_SNACK } = IUtilActionTypes;


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


export function useApi(): <T = unknown, R = unknown>(actionType: IActionTypes, load?: boolean, body?: Partial<T>, meta?: unknown) => [(reason?: string)=> void, Promise<R> | undefined] {
  const act = useAct();

  const api = useCallback(<T = unknown, R = unknown>(actionType: IActionTypes, load?: boolean, body?: Partial<T>, meta?: unknown): [(reason?: string)=> void, Promise<R> | undefined] => {

    const abortController: AbortController = new AbortController();
    function abort(reason?: string) {
      abortController.abort(reason);
    }

    try {

      if (load) act(START_LOADING, { isLoading: true });

      let parsedBody = !body ? undefined : 'string' == typeof body ? body : JSON.stringify(body);

      const methodAndPath = actionType.valueOf().split(/\/(.+)/);
      const method = methodAndPath[0];
      let path = methodAndPath[1];

      if (['delete', 'get'].indexOf(method.toLowerCase()) > -1 && parsedBody && Object.keys(parsedBody).length) {
        // Get the key of the enum from ApiActions based on the path (actionType)
        const pathKey = Object.keys(ApiActions).filter((x) => ApiActions[x] == actionType)[0];
        path = generator.generate(pathKey, parsedBody as unknown as Record<string, string>).split(/\/(.+)/)[1];
        parsedBody = undefined;
      }

      const response = fetch(`/api/${path}`, {
        signal: abortController.signal,
        method,
        body: parsedBody,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token as string}`
        }
      }).catch(() => {
        console.warn(method, path, 'Fetch was cancelled due to abort.');
      });

      void response.then(async res => {

        if (res) {
          console.log('This is whats resolved from fetch ', res, res.ok);
          try {
            if (res.ok) {
              const payload = await res.json() as R;
              act(actionType || API_SUCCESS, payload as ILoadedState, meta);
              return payload;
            } else if (403 === res.status) { }
  
            throw await res.json() as ApiErrorResponse;
          } catch (error) {
            console.error('Critical error with parsing http response', error)
          }
        }
      });

      return [abort, response as Promise<R>];
    } catch (error) {
      const { requestId, reason } = error as ApiErrorResponse;
      act(SET_SNACK, {
        snackRequestId: requestId,
        snackType: 'error',
        snackOn: 'Error: ' + (reason ? reason : 'Internal service error. You can report this if needed.')
      });
      
      return [abort, undefined];
    } finally {
      if (load) act(STOP_LOADING, { isLoading: false });
    }
  }, []);

  return api;
}
