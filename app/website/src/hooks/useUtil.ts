import { useMemo } from 'react';
import { useAppDispatch, utilSlice } from './store';

export function useUtil(): typeof utilSlice.actions {
  const dispatch = useAppDispatch();
  return useMemo(() => new Proxy(utilSlice.actions, {
    get: function (target, prop: keyof typeof utilSlice.actions) {
      return () => dispatch(target[prop]);
    }
  }), []);
}
