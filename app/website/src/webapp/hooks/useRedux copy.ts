import { useSelector } from 'react-redux';
import build from '../build.json';
import { addReducer, IReducers } from '..';
import { useCallback, useEffect, useState } from 'react';
/**
 * 
 * Typical typed redux store hook. Awayto exports `useState` for convenience.
 * 
 * ```
 * import { useRedux, useState } from 'awayto';
 * 
 * const profile = useRedux(state => state.profile);
 * const modifications = useState<IUserProfile>({ ...profile });
 * ```
 * 
 * @category Hooks
 */
// export const useRedux: TypedUseSelectorHook<ISharedState> = useSelector;

const reducers: Map<string, IReducers> = new Map();
const { reducers: builtReducers } = build as Record<string, Record<string, string>>;

export function useRedux<TSelected>(selector: (state: IMergedState) => TSelected): TSelected {
  const selectorCb = useCallback(selector, [selector]);
  const reducer = selector.toString().trim().split("state.")[1];
  const selectedValue = useSelector(selectorCb);
  
  const [stateValue, setStateValue] = useState(selectedValue);

  useEffect(() => {
    let ready = true;

    async function go() {
      if (!reducers.has(reducer)) {
        const r = await import('../modules/' + builtReducers[reducer]) as { default: IReducers };
        if (ready) {
          reducers.set(reducer, r.default);
          addReducer({ [reducer]: r.default });
        }
      }
    }

    void go();

    return () => {
      ready = false;
    }
  }, [reducer]);

  useEffect(() => {
    if (selectedValue !== undefined) {
      setStateValue(selectedValue);
    }
  }, [selectedValue]);

  return stateValue !== undefined ? stateValue : {} as TSelected;
}