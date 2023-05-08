import React, { useEffect, useState } from 'react';
import { UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { ILookup } from 'awayto/core';
import { IDefaultedComponent } from './useComponents';
import { SiteQuery } from './store';

export function useSelectOne<T extends ILookup>(label: string, { data: items }: Partial<ReturnType<UseQuery<SiteQuery<{ readonly [prop: string]: string }, T[]>>>> & { data?: T[] }): [T | undefined, IDefaultedComponent] {
  const [itemId, setItemId] = useState(Array.isArray(items) && items.length ? items[0].id : '');

  useEffect(() => {
    if (Array.isArray(items) && items.length) {
      const currentItem = items.find(it => it.id === itemId);
      if (!currentItem) {
        const firstItem = items[0];
        if (firstItem) {
          setItemId(firstItem.id);
        }
      }
    }
  }, [items, itemId]);

  const handleMenuItemClick = (id: string) => {
    if (id !== itemId) {
      setItemId(id);
    }
  };

  return [items?.find(it => it.id === itemId), () => items?.length ? <TextField
    label={label}
    select
    fullWidth
    value={itemId}
    onChange={e => {
      handleMenuItemClick(e.target.value);
    }}
  >
    {items.map((it, i) => <MenuItem key={i} value={it.id}>{it.name}</MenuItem>)}
  </TextField> : <></>];
}