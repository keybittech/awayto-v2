import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IForm } from 'awayto/core';

declare global {
  interface IProps {
    editForm?: IForm;
  }
}

export function FileSelectionModal({ closeModal, ...props }: IProps): React.JSX.Element {

  const handleSubmit = () => {
    
  }

  return <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
    <CardHeader title="Select File" />
    <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'auto' }}>
      <Box mt={2} />


    </CardContent>
    <CardActions>
      <Grid container justifyContent="space-between">
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </Grid>
    </CardActions>
  </Card>
}

export default FileSelectionModal;