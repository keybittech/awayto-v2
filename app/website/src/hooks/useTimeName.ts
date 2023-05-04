import { useState } from 'react';
import { sh } from './store';

export function useTimeName(id?: string) {
  const [tn, setTn] = useState('');
  const { data: lookups, isSuccess } = sh.useGetLookupsQuery();
  if (isSuccess && !tn) setTn(lookups.timeUnits.find(tu => tu.id == id)?.name || '')
  return tn;
}