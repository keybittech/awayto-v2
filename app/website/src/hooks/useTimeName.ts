import { useMemo } from 'react';
import { sh } from './store';

export function useTimeName(id?: string): string {
  const { data: lookups } = sh.useGetLookupsQuery();
  const timeName = useMemo(() => {
    if (lookups) {
      const tu = lookups.timeUnits.find(tu => tu.id == id);
      if (tu) {
        return tu.name;
      }
    }
    return '';
  } , [id, lookups])
  
  return timeName;
}