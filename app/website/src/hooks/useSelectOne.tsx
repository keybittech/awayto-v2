import React, { useEffect, useState } from 'react';
import { UseQuery } from '@reduxjs/toolkit/dist/query/react/buildHooks';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { ILookup } from 'awayto/core';
import { SiteQuery } from './store';

type UseSelectOneProps<T> = { data?: T[] } & Partial<ReturnType<UseQuery<SiteQuery<{ readonly [prop: string]: string }, T[]>>>>;

type UseSelectOneResponse<T> = {
  item?: T;
  setId: (id: string) => void;
  comp: (props?: IProps) => React.JSX.Element;
};

export function useSelectOne<T extends ILookup>(label: string, { data: items }: UseSelectOneProps<T>): UseSelectOneResponse<T> {
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

  return {
    item: items?.find(it => it.id === itemId),
    setId: setItemId,
    comp: (props) => items?.length ? <TextField
      label={label}
      select
      fullWidth
      value={itemId}
      onChange={e => {
        handleMenuItemClick(e.target.value);
      }}
    >
      {props?.children ? props.children : items.map((it, i) => <MenuItem key={i} value={it.id}>{it.name}</MenuItem>)}
    </TextField> : <></>
  };
}