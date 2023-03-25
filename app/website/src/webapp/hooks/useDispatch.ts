import { AnyAction, Store } from 'redux';
import { useDispatch as dispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { PayloadAction } from '@reduxjs/toolkit';
import { IActionTypes } from 'awayto';

/**
* @category Awayto Redux
*/
export type ThunkStore = Store<IMergedState, PayloadAction<IActionTypes, IMergedState & string>> & {
  dispatch: ThunkDispatch<IMergedState, undefined, PayloadAction<IActionTypes, IMergedState & string>>;
}

export let store: ThunkStore;

export const setStore = (newStore: ThunkStore): void => {
  store = newStore
}

/**
 * 
 * Deprecated: Use the `useAct` hook instead!
 * 
 * Typical dispatch.
 * 
 * ```
 * const dispatch = useDispatch();
 * dispatch(act(...));
 * ```
 * 
 * @deprecated
 * @category Hooks
 */
export const useDispatch = (): ThunkDispatch<IMergedState, undefined, AnyAction> => dispatch<ThunkDispatch<IMergedState, undefined, AnyAction>>();