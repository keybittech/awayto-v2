import React, { useMemo } from 'react';

import Avatar from '@mui/material/Avatar';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';

import { IServiceTier } from 'awayto/core';
import { useGrid, useStyles } from 'awayto/hooks';

declare global {
  interface IProps {
    serviceTiers?: IServiceTier[];
  }
}

export function ServiceTierAddons({ serviceTiers }: IProps): JSX.Element {
  if (!serviceTiers) return <></>;

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
    rows: serviceTierAddons.map(name => ({ name })),
    columns: [
      { type: 'string', field: 'name', headerName: '' },
      ...serviceTiers.reduce((memo, { name, addons }) => {
        memo.push({
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

  return <Accordion defaultExpanded={true}>
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      aria-controls="tiers-and-features-content"
      id="tiers-and-features-header"
    >
      <Typography>Features</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <DataGrid {...tierGridProps} />
    </AccordionDetails>
  </Accordion>
}

export default ServiceTierAddons;