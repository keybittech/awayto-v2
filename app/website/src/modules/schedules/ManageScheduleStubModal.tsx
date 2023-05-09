import React, { useState, useCallback, useContext, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';

import { IGroupUserScheduleStub, shortNSweet, IGroupUserSchedule, IGroupUserScheduleStubReplacement } from 'awayto/core';
import { sh, useComponents, useContexts } from 'awayto/hooks';

declare global {
  interface IProps {
    editGroupUserScheduleStub?: IGroupUserScheduleStub;
  }
}

export function ManageScheduleStubModal({ editGroupUserScheduleStub, closeModal }: Required<IProps>): JSX.Element {
  
  const { GroupContext, GroupScheduleContext, GroupScheduleSelectionContext } = useContexts();

  const {
    group
  } = useContext(GroupContext) as GroupContextType;

  const {
    selectGroupSchedule: { item: groupSchedule },
    getGroupUserSchedules: { data: groupUserSchedules }
  } = useContext(GroupScheduleContext) as GroupScheduleContextType;

  const {
    quote,
    selectedDate,
    firstAvailable
  } = useContext(GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;
  
  const { ScheduleDatePicker, ScheduleTimePicker } = useComponents();

  const [putGroupUserScheduleStubReplacement] = sh.usePutGroupUserScheduleStubReplacementMutation();
  const [getGroupUserScheduleStubReplacement] = sh.useLazyGetGroupUserScheduleStubReplacementQuery(); 

  const [replacement, setReplacement] = useState(editGroupUserScheduleStub.replacement);

  const originalReplacement = editGroupUserScheduleStub?.replacement && { ...editGroupUserScheduleStub.replacement };

  useEffect(() => {
    if (Object.keys(quote).length) {
      const { userScheduleId, tierName } = editGroupUserScheduleStub;
            
      getGroupUserScheduleStubReplacement({
        groupName: group.name,
        userScheduleId,
        slotDate: quote.slotDate,
        startTime: quote.startTime,
        tierName
      }).unwrap().then(stubs => {
        const [replacementStub] = stubs;
        setReplacement(replacementStub.replacement);
      }).catch(console.error);
    }
  }, [quote]);

  const handleSubmit = useCallback(() => {
    putGroupUserScheduleStubReplacement({
      groupName: group.name,
      userScheduleId: editGroupUserScheduleStub.userScheduleId,
      quoteId: editGroupUserScheduleStub.quoteId,
      slotDate: (selectedDate || firstAvailable.time).format("YYYY-MM-DD"),
      startTime: replacement.startTime,
      serviceTierId: replacement.serviceTierId,
      scheduleBracketSlotId: replacement.scheduleBracketSlotId
    } as IGroupUserSchedule & IGroupUserScheduleStubReplacement).unwrap().then(() => {
      if (closeModal)
        closeModal();
    }).catch(console.error);
  }, [editGroupUserScheduleStub, replacement]);

  return <>
    <Card>
      <CardHeader title={`${shortNSweet(editGroupUserScheduleStub.slotDate, editGroupUserScheduleStub.startTime)}`} subheader={`${editGroupUserScheduleStub.serviceName} ${editGroupUserScheduleStub.tierName}`} />
      <CardContent>

        {groupSchedule && !groupUserSchedules?.length ? <Alert severity="info">
          The master schedule {groupSchedule.name} has no available user schedules.
        </Alert> : <>
          {originalReplacement && <>
            <Box mb={2}>
              <Typography>Use an existing slot at the same date and time:</Typography>
            </Box>
            <Box mb={4}>
              <Button fullWidth variant="contained" color="secondary" onClick={handleSubmit}>Reassign to {originalReplacement.username}</Button>
            </Box>

            <Grid container direction="row" alignItems="center" spacing={2} mb={4}>
              <Grid item flexGrow={1}>
                <Divider />
              </Grid>
              <Grid item>
                Or
              </Grid>
              <Grid item flexGrow={1}>
                <Divider />
              </Grid>
            </Grid>
          </>}

          <Box mb={4}>
            <Box mb={2}>
              <Typography>Select a new date and time:</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <ScheduleDatePicker
                  key={editGroupUserScheduleStub.userScheduleId}
                />
              </Grid>
              <Grid item xs={6}>
                <ScheduleTimePicker
                  key={selectedDate?.format("YYYY-MM-DD")}
                />
              </Grid>
            </Grid>
          </Box>

          {replacement?.username && <Box my={2}>
            <Button onClick={handleSubmit} fullWidth variant="contained" color="secondary">Reassign to {replacement.username}</Button>
          </Box>}
        </>}

        
      </CardContent>
      <CardActions>
        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Close</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageScheduleStubModal;