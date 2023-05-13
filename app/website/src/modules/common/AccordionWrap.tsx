import React, { useRef } from 'react';

import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { nid, toSnakeCase } from 'awayto/core';

export function AccordionWrap({
  label,
  invalidSubmission,
  expanded,
  onChange,
  children,
}: IProps & {
  label: string;
  invalidSubmission?: boolean;
  expanded?: boolean;
  onChange?: (event: React.SyntheticEvent<Element, Event>, expanded: boolean) => void;
}): React.JSX.Element {
  const idRef = useRef(`${nid()}-${toSnakeCase(label)}`);

  return (
    <Accordion expanded={expanded} onChange={onChange}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`accordion-content-${idRef.current}`}
      >
        <Grid container sx={{ alignItems: 'center', placeContent: 'space-between' }}>
          <Grid item>
            <Typography>{label}</Typography>
          </Grid>
          <Grid item>
            {invalidSubmission && <Alert severity="error">Review</Alert>}
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

export default AccordionWrap;