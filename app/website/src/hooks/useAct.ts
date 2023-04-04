import { useDispatch } from './useDispatch';
import { IActionTypes } from 'awayto/core';

/**
 * `useAct` is a wrapper for dispatching actions. Give it an action type (i.e. SET_SNACK), a loader boolean, and the action payload if necessary.
 * 
 * @category Hooks
 */
export function useAct(): (actionType: IActionTypes, state: Partial<any>, meta?: unknown) => void {
  const dispatch = useDispatch();
  return (actionType, state, meta) => {
    // dispatch(act(actionType, state, meta));
  };
}