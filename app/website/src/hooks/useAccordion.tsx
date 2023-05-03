import React from 'react';

import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { nid, toSnakeCase } from 'awayto/core';
import { IBaseComponent } from './useComponents';

export function useAccordion(label: string, child: JSX.Element): React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element) {
  return () => <Accordion defaultExpanded={true}>
  <AccordionSummary
    expandIcon={<ExpandMoreIcon />}
    aria-controls={`accordion-content-${nid()}-${toSnakeCase(label)}`}
  >
    <Typography>{label}</Typography>
  </AccordionSummary>
  <AccordionDetails>
    {child}
  </AccordionDetails>
</Accordion>
}