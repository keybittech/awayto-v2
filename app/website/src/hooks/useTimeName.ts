import { sh } from './store';

export function useTimeName(id?: string) {
  const { data: lookups } = sh.useGetLookupsQuery();
  return lookups?.timeUnits.find(tu => tu.id == id)?.name;
}