import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';

import { IGroupScheduleDateSlots, IGroupUserScheduleStub, quotedDT, shortNSweet, IGroupUserSchedule, IGroupUserScheduleStubReplacement } from 'awayto/core';
import { sh, useComponents } from 'awayto/hooks';

declare global {
  interface IProps {
    editGroupUserScheduleStub?: IGroupUserScheduleStub;
  }
}

export function ManageScheduleStubModal({ editGroupUserScheduleStub, closeModal }: IProps): JSX.Element {
  if (!editGroupUserScheduleStub) return <></>;

  const { groupName } = useParams();
  if (!groupName) return <></>;
  
  const { ScheduleDatePicker, ScheduleTimePicker } = useComponents();

  const [putGroupUserScheduleStubReplacement] = sh.usePutGroupUserScheduleStubReplacementMutation();
  const [getGroupUserScheduleStubReplacement] = sh.useLazyGetGroupUserScheduleStubReplacementQuery(); 

  const [_, { data: dateSlots }] = sh.useLazyGetGroupScheduleByDateQuery();

  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs() } as IGroupScheduleDateSlots);
  const [activeSchedule, setActiveSchedule] = useState('');

  const [bracketSlotDate, setBracketSlotDate] = useState<dayjs.Dayjs | null>();
  const [bracketSlotTime, setBracketSlotTime] = useState<dayjs.Dayjs | null>();

  const [replacement, setReplacement] = useState(editGroupUserScheduleStub.replacement);

  const originalReplacement = editGroupUserScheduleStub?.replacement && { ...editGroupUserScheduleStub.replacement };

  if (editGroupUserScheduleStub.userScheduleId && activeSchedule !== editGroupUserScheduleStub.userScheduleId && dateSlots?.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
    setActiveSchedule(editGroupUserScheduleStub.userScheduleId);
  }

  const handleSubmit = useCallback(() => {
    async function go() {
      if (editGroupUserScheduleStub && groupName) {
        await putGroupUserScheduleStubReplacement({
          groupName,
          userScheduleId: editGroupUserScheduleStub.userScheduleId,
          quoteId: editGroupUserScheduleStub.quoteId,
          slotDate: (bracketSlotDate || firstAvailable.time).format("YYYY-MM-DD"),
          startTime: replacement.startTime,
          serviceTierId: replacement.serviceTierId,
          scheduleBracketSlotId: replacement.scheduleBracketSlotId
        } as IGroupUserSchedule & IGroupUserScheduleStubReplacement).unwrap();
    
        if (closeModal)
          closeModal();
      }
    }
  }, [editGroupUserScheduleStub, groupName]);

  return <>
    <Card>
      <CardHeader title={`${shortNSweet(editGroupUserScheduleStub.slotDate, editGroupUserScheduleStub.startTime)}`} subheader={`${editGroupUserScheduleStub.serviceName} ${editGroupUserScheduleStub.tierName}`} />
      <CardContent>
        {originalReplacement && <>
          <Box mb={2}>
            <Typography>Use an existing slot at the same date and time:</Typography>
          </Box>
          <Box mb={4}>
            <Button fullWidth variant="contained" color="primary" onClick={handleSubmit}>Reassign to {originalReplacement.username}</Button>
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
                key={bracketSlotDate?.format("YYYY-MM-DD")}
                // onTimeAccept={({ slotDate, startTime }) => {
                //   const { userScheduleId, tierName } = editGroupUserScheduleStub;
            
                //   getGroupUserScheduleStubReplacement({
                //     groupName,
                //     userScheduleId,
                //     slotDate,
                //     startTime,
                //     tierName
                //   }).unwrap().then(({ stubs }) => {
                //     const [replacementStub] = stubs;
                //     if (replacementStub) {
                //       setReplacement(replacementStub.replacement);
                //     }
                //   }).catch(console.error);
                // }}
              />
            </Grid>
          </Grid>
        </Box>

        {replacement?.username && <Box my={2}>
          <Button onClick={handleSubmit} fullWidth variant="contained" color="primary">Reassign to {replacement.username}</Button>
        </Box>}
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