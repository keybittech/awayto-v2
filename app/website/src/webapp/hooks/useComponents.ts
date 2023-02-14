import { hasGroupRole, SiteRoles } from 'awayto';
import { LazyExoticComponent } from 'react';
import { createElement, useMemo, lazy } from 'react';
import { useParams } from 'react-router';
import { IBaseComponent, IBaseComponents } from '..';

import buildOutput from '../build.json';
import rolesOutput from '../roles.json';
import { useRedux } from './useRedux';

const { views } = buildOutput as Record<string, Record<string, string>>;
const { roles } = rolesOutput as {
  roles: {
    [prop: string]: SiteRoles[]
  }
};


const components = {} as IBaseComponents;

/**
 * `useComponents` takes advantage of [React.lazy](https://reactjs.org/docs/code-splitting.html#reactlazy) as well as the [Proxy API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). By combining these functionalities, we end up with a tool that seamlessly meshes with expanding and changing codebases.
 * 
 * As new files are added to the project while the developer is working, they will be automatically discovered and made lazily available through `useComponents`. The only need is to refresh the browser page once the component has been added to the render cycle.
 * 
 * ```
 * import { useComponents } from 'awayto';
 * 
 * const { NewDevelopmentComponent } = useComponents();
 * 
 * render <NewDevelopmentComponent {...props} />;
 * ```
 * 
 * @category Hooks
 */
export function useComponents(): IBaseComponents {
  const { groupRoles } = useRedux(state => state.profile);
  const { groupName } = useParams();

  const comps = useMemo(() => {
    return new Proxy(components, {
      get: function (target: IBaseComponents, prop: string): LazyExoticComponent<IBaseComponent> | (() => JSX.Element) {

        const compPath = views[prop];

        if (groupName && roles[compPath]?.length && !hasGroupRole(groupName, groupRoles, roles[compPath] )) {
          components[prop] = ((): JSX.Element => createElement('div'));
        }
      
        if (!components[prop]) components[prop] = lazy<IBaseComponent>(() => import(`../modules/${views[prop]}`) as Promise<{ default: IBaseComponent }>);

        target[prop] = views[prop] ? components[prop] : ((): JSX.Element => createElement('div'));

        return Reflect.get(target, prop);
      }
    });
  }, [groupRoles, groupName]);

  return comps;
}
