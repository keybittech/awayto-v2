import { useAppSelector, RootState } from './store';

export function useStore <T>(selector: (state: RootState) => T): T {
  return useAppSelector(selector);
}