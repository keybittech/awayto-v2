import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { IBaseComponent } from './useComponents';
import { SiteQuery } from './store';
import { UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks';
import { ILookup } from 'awayto/core';

export function useSelectOne<T extends ILookup>(label: string, { data: items }: Partial<ReturnType<UseQuery<SiteQuery<{ readonly [prop: string]: string }, T[]>>>> & { data?: T[] }): [T | undefined, React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element)] {
  const [itemId, setItemId] = useState('');
  
  if (Array.isArray(items) && items.length && !itemId) {
    const firstItem = items[0];
    if (firstItem) {
      setItemId(firstItem.id);
    }
  }

  return [items?.find(it => it.id === itemId), () => items?.length ? <TextField
    label={label}
    select
    fullWidth
    value={itemId}
    onChange={e => {
      if (e.target.value !== itemId) {
        setItemId(e.target.value);
      }
    }}
  >
    {items.map((it, i) => <MenuItem key={i} value={it.id}>{it.name}</MenuItem>)}
  </TextField> : <></>];
}