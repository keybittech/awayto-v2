import React, { useState } from "react";
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

import { IGroupScheduleDateSlots, IGroupUserScheduleStub, IGroupUserScheduleActionTypes, IGroupUserScheduleStubReplacement, quotedDT, shortNSweet, IGroupUserScheduleState } from "awayto";
import { useApi, useAct, useRedux } from 'awayto-hooks';
import { useCallback } from "react";
import ScheduleDatePicker from "./ScheduleDatePicker";
import ScheduleTimePicker from "./ScheduleTimePicker";
import { useParams } from "react-router";

const { GET_GROUP_USER_SCHEDULE_STUB_REPLACEMENT, PUT_GROUP_USER_SCHEDULE_STUB_REPLACEMENT } = IGroupUserScheduleActionTypes;

declare global {
  interface IProps {
    editGroupUserScheduleStub?: IGroupUserScheduleStub;
  }
}

export function ManageScheduleStubModal({ editGroupUserScheduleStub, closeModal }: IProps): JSX.Element {
  if (!editGroupUserScheduleStub) return <></>;

  const { groupName } = useParams();

  const api = useApi();
  const { dateSlots } = useRedux(state => state.groupSchedule);

  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs() } as IGroupScheduleDateSlots);
  const [activeSchedule, setActiveSchedule] = useState('');

  const [bracketSlotDate, setBracketSlotDate] = useState<dayjs.Dayjs | null>();
  const [bracketSlotTime, setBracketSlotTime] = useState<dayjs.Dayjs | null>();

  const [replacement, setReplacement] = useState(editGroupUserScheduleStub.replacement);

  const originalReplacement = editGroupUserScheduleStub?.replacement && { ...editGroupUserScheduleStub.replacement };

  if (editGroupUserScheduleStub.userScheduleId && activeSchedule !== editGroupUserScheduleStub.userScheduleId && dateSlots.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
    setActiveSchedule(editGroupUserScheduleStub.userScheduleId);
  }

  const handleSubmit = useCallback(() => {
    const [, res] = api(PUT_GROUP_USER_SCHEDULE_STUB_REPLACEMENT, {
      groupName,
      userScheduleId: editGroupUserScheduleStub.userScheduleId,
      quoteId: editGroupUserScheduleStub.quoteId,
      slotDate: (bracketSlotDate || firstAvailable.time).format("YYYY-MM-DD"),
      startTime: replacement.startTime,
      serviceTierId: replacement.serviceTierId,
      scheduleBracketSlotId: replacement.scheduleBracketSlotId
    });

    res?.then(() => {
      if (closeModal) closeModal();
    }).catch(console.warn);
  }, [editGroupUserScheduleStub]);

  return <>
    <Card>
      <CardHeader title={`${shortNSweet(editGroupUserScheduleStub.slotDate, editGroupUserScheduleStub.startTime)}`} subheader={`${editGroupUserScheduleStub.serviceName} ${editGroupUserScheduleStub.tierName}`} />
      <CardContent>
        {originalReplacement && <>
          <Box mb={2}>
            <Typography>Use an existing slot at the same date and time:</Typography>
          </Box>
          <Box mb={4}>
            <Button fullWidth variant="contained" color="primary" onClick={() => handleSubmit()}>Reassign to {originalReplacement.username}</Button>
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
                scheduleId={editGroupUserScheduleStub.groupScheduleId}
                groupName={groupName}
                firstAvailable={firstAvailable}
                bracketSlotDate={bracketSlotDate || firstAvailable.time || null}
                onDateChange={(date: dayjs.Dayjs | null) => setBracketSlotDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date : null)}
              />
            </Grid>
            <Grid item xs={6}>
              <ScheduleTimePicker
                key={bracketSlotDate?.format("YYYY-MM-DD")}
                scheduleId={editGroupUserScheduleStub.groupScheduleId}
                firstAvailable={firstAvailable}
                bracketSlotDate={bracketSlotDate || firstAvailable.time}
                bracketSlotTime={bracketSlotTime || firstAvailable.time}
                onTimeChange={({ time }) => setBracketSlotTime(time)}
                onTimeAccept={({ slotDate, startTime }) => {
                  const { userScheduleId, tierName } = editGroupUserScheduleStub;
            
                  const [, res] = api(GET_GROUP_USER_SCHEDULE_STUB_REPLACEMENT, {
                    groupName,
                    userScheduleId,
                    slotDate,
                    startTime,
                    tierName
                  }, { useParams: true });

                  res?.then(stubRes => {
                    const { stubs: [replacementStub] } = stubRes as IGroupUserScheduleState;
                    if (replacementStub) {
                      setReplacement(replacementStub.replacement);
                    }
                  });
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {replacement?.username && <Box my={2}>
          <Button onClick={() => handleSubmit()} fullWidth variant="contained" color="primary">Reassign to {replacement.username}</Button>
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