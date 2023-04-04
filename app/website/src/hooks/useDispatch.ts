import { AnyAction } from 'redux';
import { useDispatch as dispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

/**
 * 
 * Typical dispatch.
 * 
 * ```
 * const dispatch = useDispatch();
 * dispatch(act(...));
 * ```
 * 
 * @category Hooks
 */
export const useDispatch = (): ThunkDispatch<any, undefined, AnyAction> => dispatch<ThunkDispatch<any, undefined, AnyAction>>();