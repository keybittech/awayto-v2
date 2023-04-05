import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from './store';

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
export const useRedux: TypedUseSelectorHook<RootState> = useSelector;