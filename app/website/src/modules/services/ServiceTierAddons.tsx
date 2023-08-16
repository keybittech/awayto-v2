import React, { useMemo } from 'react';

import Avatar from '@mui/material/Avatar';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import CheckIcon from '@mui/icons-material/Check';

import { IService } from 'awayto/core';
import { useGrid, useStyles } from 'awayto/hooks';

declare global {
  interface IProps {
    service?: IService;
  }
}

export function ServiceTierAddons({ service }: IProps): React.JSX.Element {

  const serviceTiers = useMemo(() => Object.values(service?.tiers || {}), [service]);

  const classes = useStyles();

  const serviceTierData = useMemo(() => {
    const rows: { name: string, tiers: string[] }[] = [];
    if (serviceTiers) {
      serviceTiers.forEach(st => {
        for (const addon of Object.values(st.addons)) {
          const recordId = rows.findIndex(r => r.name === addon.name);
          const existing = recordId > -1 ? rows[recordId] : { id: `sta_cell_${st.id}_${addon.id}`, name: addon.name, tiers: [] } as { name: string, tiers: string[] };
          existing.tiers.push(st.name);
          if (recordId > -1) {
            rows[recordId] = existing;
          } else {
            rows.push(existing);
          }
        }
      });
    }
    return rows;
  }, [serviceTiers]);

  const tierGridProps = useGrid({
    noPagination: true,
    rows: serviceTierData,
    columns: [
      { type: 'string', field: 'name', headerName: '', flex: 1 },
      ...serviceTiers.map<GridColDef<{ tiers: string[] }>>(st => ({
        type: 'string',
        field: `sta_col_${st.id}`,
        headerName: st.name,
        renderCell: params => params.row.tiers.includes(st.name) ? <Avatar sx={{ width: 24, height: 24, backgroundColor: 'white' }}><CheckIcon className={classes.green} /></Avatar> : '--',
        flex: 1
      }))
    ]
  });

  return <DataGrid {...tierGridProps} />;
}

export default ServiceTierAddons;