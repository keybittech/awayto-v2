import React, { useMemo } from 'react';

import Avatar from '@mui/material/Avatar';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import CheckIcon from '@mui/icons-material/Check';

import { IService, nid } from 'awayto/core';
import { useGrid, useStyles } from 'awayto/hooks';

declare global {
  interface IProps {
    service?: IService;
  }
}

export function ServiceTierAddons({ service }: IProps): React.JSX.Element {
  if (!service) return <></>;

  const serviceTiers = useMemo(() => Object.values(service.tiers), [service]);

  if (!serviceTiers.length) return <></>;

  const classes = useStyles();

  const serviceTierAddons = useMemo(() => {
    return serviceTiers
      .sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())
      .reduce<string[]>((memo, { addons }) => {
        const serviceAddons = Object.values(addons);
        if (serviceAddons) {
          for (let i = 0, v = serviceAddons.length; i < v; i++) {
            const { name } = serviceAddons[i];
            if (memo.indexOf(name) < 0) memo.push(name);
          }
        }
        return memo;
      }, []);
  }, [serviceTiers]);

  const tierGridProps = useGrid({
    noPagination: true,
    rows: serviceTierAddons.map(name => ({ id: nid(), name })),
    columns: [
      { type: 'string', field: 'name', headerName: '', flex: 1 },
      ...serviceTiers.reduce((memo, { name, addons }) => {
        memo.push({
          flex: 1,
          headerName: name,
          field: '',
          renderCell: ({ row }) => {
            return Object.values(addons).map(ad => ad.name).indexOf(row.name) > -1 ? <Avatar sx={{ width: 24, height: 24, backgroundColor: 'white' }}><CheckIcon className={classes.green} /></Avatar> : '--';
          }
        });
        return memo;
      }, [] as GridColDef<{ name: string }>[])
    ]
  });

  return <DataGrid {...tierGridProps} />;
}

export default ServiceTierAddons;