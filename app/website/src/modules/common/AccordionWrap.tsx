import React, { useRef } from 'react';

import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { nid, toSnakeCase } from 'awayto/core';
import { useAccordion } from 'awayto/hooks';

export function AccordionWrap({
  label,
  icon: Icon,
  invalidSubmission,
  expanded,
  onChange,
  children,
  absolute
}: IProps & ReturnType<typeof useAccordion>): React.JSX.Element {
  const idRef = useRef(`${nid()}-${toSnakeCase(label)}`);

  return (
    <Accordion sx={!absolute ? undefined : { position: 'relative' }} disableGutters variant='outlined' expanded={expanded} onChange={onChange}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon color="secondary" />}
        aria-controls={`accordion-content-${idRef.current}`}
      >
        <Grid container sx={{ alignItems: 'center', placeContent: 'space-between' }}>
          <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
            {Icon && <Grid item>
              <Avatar>
                <Icon />
              </Avatar>
            </Grid>}
            <Grid item sx={{ alignSelf: 'center' }}>
              <Typography sx={{ pl: 2, fontStyle: 'underline' }}>{label}</Typography>
            </Grid>
          </Grid>
          <Grid item sx={{ display: 'flex' }}>
            {invalidSubmission && <Alert severity="error">Review</Alert>}
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails
        sx={!absolute ? undefined : {
          position: 'absolute',
          zIndex: 100,
          bgcolor: 'primary.main',
          maxHeight: expanded ? '200px' : '0', // Adjust '200px' based on your content size
          overflow: 'hidden',
          transition: 'max-height 0.32s ease',
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

export default AccordionWrap;