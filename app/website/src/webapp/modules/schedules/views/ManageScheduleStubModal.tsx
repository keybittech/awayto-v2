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

import { IGroupScheduleDateSlots, IGroupUserScheduleStub, IGroupUserScheduleActionTypes, quotedDT, shortNSweet, IGroupUserScheduleState } from "awayto";
import { useApi, useAct, useRedux } from 'awayto-hooks';
import { useCallback } from "react";
import ScheduleDatePicker from "./ScheduleDatePicker";
import ScheduleTimePicker from "./ScheduleTimePicker";
import { useParams } from "react-router";

const { GET_GROUP_USER_SCHEDULE_STUB_REPLACEMENT } = IGroupUserScheduleActionTypes;

declare global {
  interface IProps {
    editGroupUserScheduleStub?: IGroupUserScheduleStub;
  }
}

export function ManageScheduleStubModal({ editGroupUserScheduleStub, closeModal }: IProps): JSX.Element {

  const { groupName } = useParams();

  const api = useApi();
  const act = useAct();
  const { dateSlots } = useRedux(state => state.groupSchedule);

  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs().startOf('day') } as IGroupScheduleDateSlots);
  const [activeSchedule, setActiveSchedule] = useState('');
  const [searching, setSearching] = useState(false);

  const [bracketSlotDate, setBracketSlotDate] = useState<dayjs.Dayjs | null>();
  const [bracketSlotTime, setBracketSlotTime] = useState<dayjs.Dayjs | null>();

  const [groupUserScheduleStub, setGroupUserScheduleStub] = useState({ ...editGroupUserScheduleStub } as IGroupUserScheduleStub);

  const originalReplacement = editGroupUserScheduleStub && { ...editGroupUserScheduleStub.replacement };

  if (groupUserScheduleStub.userScheduleId && activeSchedule !== groupUserScheduleStub.userScheduleId && dateSlots.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
    setActiveSchedule(groupUserScheduleStub.userScheduleId);
  }

  const handleSubmit = useCallback((replacement: Partial<IGroupUserScheduleStub['replacement']>) => {
    
    
    console.log({ replacement });
    //   if (closeModal)
    //     closeModal();
  }, [groupUserScheduleStub]);

  return <>
    <Card>
      <CardHeader title={`${shortNSweet(groupUserScheduleStub.slotDate, groupUserScheduleStub.startTime)}`} subheader={`${groupUserScheduleStub.serviceName} ${groupUserScheduleStub.tierName}`} />
      <CardContent>
        {originalReplacement && <>
          <Box mb={2}>
            <Typography>Use an existing slot at the same date and time:</Typography>
          </Box>
          <Box mb={4}>
            <Button fullWidth variant="contained" color="primary" onClick={() => handleSubmit(originalReplacement)}>Reassign to {originalReplacement.username}</Button>
          </Box>

          <Grid container direction="row" alignItems="center" spacing={2}>
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

        <Box my={4}>
          <Box mb={2}>
            <Typography>Select a new date and time:</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ScheduleDatePicker
                key={groupUserScheduleStub.groupScheduleId}
                scheduleId={groupUserScheduleStub.groupScheduleId}
                groupName={groupName}
                firstAvailable={firstAvailable}
                value={bracketSlotDate || firstAvailable.time || null}
                onDateChange={(date: dayjs.Dayjs | null) => setBracketSlotDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date : null)}
              />
            </Grid>
            <Grid item xs={6}>
              <ScheduleTimePicker
                key={groupUserScheduleStub.groupScheduleId}
                scheduleId={groupUserScheduleStub.groupScheduleId}
                firstAvailable={firstAvailable}
                bracketSlotDate={bracketSlotDate}
                value={bracketSlotTime || firstAvailable.time}
                disabled={searching}
                onTimeChange={({ time }) => setBracketSlotTime(time)}
                onTimeAccept={({ slotDate, startTime }) => {
                  setSearching(true);

                  const { userScheduleId, tierName } = groupUserScheduleStub;
            
                  const [, res] = api(GET_GROUP_USER_SCHEDULE_STUB_REPLACEMENT, {
                    groupName,
                    userScheduleId,
                    slotDate,
                    startTime,
                    tierName
                  }, { useParams: true });

                  res?.then(stubRes => {
                    const { stubs: [replacementStub] } = stubRes as IGroupUserScheduleState;
                    
                      console.log({ stubRes })
                    if (replacementStub) {
                      setGroupUserScheduleStub({
                        ...groupUserScheduleStub,
                        replacement: replacementStub.replacement
                      } as IGroupUserScheduleStub);
                    }
                  }).finally(() => {
                    setSearching(false);
                  });

                }}
              />
            </Grid>
          </Grid>
        </Box>

        {groupUserScheduleStub.replacement?.username && <Box my={2}>
          <Button onClick={() => handleSubmit(groupUserScheduleStub.replacement)} fullWidth variant="contained" color="primary">Reassign to {groupUserScheduleStub.replacement?.username}</Button>
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