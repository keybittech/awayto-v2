import { useMemo } from 'react';
import { useAppDispatch, utilSlice } from './store';
import { IUtil } from 'awayto/core';

export function useUtil(): typeof utilSlice.actions {
  const dispatch = useAppDispatch();
  return useMemo(() => new Proxy(utilSlice.actions, {
    get: function (target, prop: keyof typeof utilSlice.actions) {
      // Forward the arguments passed to the action creators
      return (...args: [IUtil]) => dispatch(target[prop](...args));
    }
  }), []);
}
