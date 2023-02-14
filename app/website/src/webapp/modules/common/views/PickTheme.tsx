import React from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { IUtilActionTypes, PaletteMode } from 'awayto';
import { useAct, useStyles } from 'awayto-hooks';

const { SET_THEME } = IUtilActionTypes;

declare global {
  interface IProps {
    showTitle?: boolean;
  }
}

export function PickTheme (props: IProps): JSX.Element {
  const { showTitle } = props;
  const classes = useStyles();
  const act = useAct();

  const edit = (e: React.SyntheticEvent) => {
    act(SET_THEME, { theme: e.currentTarget.id as PaletteMode });
  };

  return <>
    <Grid container alignItems="center">
      {showTitle ? <Grid item><Typography>Theme</Typography></Grid> : <></>}
      <Grid item onClick={edit} id="dark"><Box bgcolor="gray" className={classes.colorBox} /></Grid>
      <Grid item onClick={edit} id="light"><Box bgcolor="white" className={classes.colorBox} /></Grid>
      {/* <Grid item onClick={edit} id="blue"><Box bgcolor="deepskyblue" className={classes.colorBox} /></Grid> */}
    </Grid>
  </>
}

export default PickTheme;