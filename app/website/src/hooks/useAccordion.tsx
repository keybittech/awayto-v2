import React, { useCallback } from 'react';

import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { nid, toSnakeCase } from 'awayto/core';

export function useAccordion(label: string): ((props: IProps) => JSX.Element) {
  const renderAccordion = useCallback(({ children }: IProps) => {
    return <Accordion defaultExpanded={true}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`accordion-content-${nid()}-${toSnakeCase(label)}`}
      >
        <Typography>{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {children}
      </AccordionDetails>
    </Accordion>
  }, [label]);
  return renderAccordion;
}