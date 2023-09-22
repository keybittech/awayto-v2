import { ComponentType, FunctionComponent, ReactNode, LazyExoticComponent, createElement, useMemo, lazy } from 'react';

import { hasGroupRole, SiteRoles, isExternal } from 'awayto/core';

import buildOutput from '../build.json';
import rolesOutput from '../roles.json';
import { sh, useAppSelector } from './store';

const { views } = buildOutput as Record<string, Record<string, string>>;
const { roles } = rolesOutput as {
  roles: {
    [prop: string]: SiteRoles[]
  }
};

/**
 * @category Awayto React
 */
// eslint-disable-next-line
export type IBaseComponent = FunctionComponent<IProps> & ComponentType<any> & ReactNode;

/**
 * @category Awayto React
 */
export type IDefaultedComponent = LazyExoticComponent<IBaseComponent> | ((props?: IProps) => JSX.Element);

/**
 * @category Awayto React
 */
export type IBaseComponents = Record<string, IDefaultedComponent>;

const components = {} as IBaseComponents;

/**
 * `useComponents` is a React custom hook that takes advantage of [React.lazy](https://reactjs.org/docs/code-splitting.html#reactlazy) as well as the [Proxy API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). By combining these functionalities, `useComponents` becomes an efficient tool that smoothly integrates with codebases that are regularly changing or expanding.
 * 
 * The `useComponents` hook searches for newly added files in the project and makes them easily accessible through the tool.
 * 
 * This feature is designed to work seamlessly with React's code splitting features, which provide additional performance improvements in terms of bundling and code delivery to the user. `useComponents` will not provide access to a component until it's required, reducing initial page load times and improving site interactivity.
 * 
 * ```
 * import { useComponents } from 'awayto/hooks';
 * 
 * const { NewDevelopmentComponent } = useComponents();
 * 
 * render <NewDevelopmentComponent {...props} />;
 * ```
 *
 * When `useComponents` is called, it first uses the `useParams` hook to identify the current URL's group name. Once obtained, `useComponents` lazily loads the various components in the project and makes them available for rendering. 
 *
 * `useComponents` also checks whether a user has access to render a component, based on their group membership and available roles. If a user does not have the correct group membership or role, then the component is not returned and is replaced with a blank <div> element. 
 * 
 * Each component has a corresponding path with roles linked to it that are maintained in `roles.json`. These roles represent the permissions required to access and render a given component. These roles can be expanded on with "export const roles = [....];" in a file that should be restricted.
 *
 * @category Hooks
 */
export function useComponents(): IBaseComponents {

  const { authenticated } = useAppSelector(state => state.auth);

  const { data: profile } = sh.useGetUserProfileDetailsQuery(undefined, { skip: !authenticated || isExternal(window.location.pathname) });

  const group = useMemo(() => Object.values(profile?.groups || {}).find(g => g.active), [profile]);

  const comps = useMemo(() => {
    return new Proxy(components, {
      get: function (target: IBaseComponents, prop: string): LazyExoticComponent<IBaseComponent> | (() => JSX.Element) {
        if (profile && group && roles[views[prop]]?.length && !hasGroupRole(group.name, profile.availableUserGroupRoles, roles[views[prop]] )) {
          components[prop] = ((): React.JSX.Element => createElement('div'));
        }
      
        if (!components[prop]) components[prop] = lazy<IBaseComponent>(() => import(`../${views[prop]}`) as Promise<{ default: IBaseComponent }>);

        target[prop] = views[prop] ? components[prop] : ((): React.JSX.Element => createElement('div'));

        return Reflect.get(target, prop);
      }
    });
  }, [profile, group]);

  return comps;
}