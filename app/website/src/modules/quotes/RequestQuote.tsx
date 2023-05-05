import React, { useContext } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { useComponents, useContexts, sh, useUtil, useGroupForm, useAccordion } from 'awayto/hooks';
import { IQuote } from 'awayto/core';

export function RequestQuote(props: IProps): JSX.Element {

  const navigate = useNavigate();
  const { setSnack } = useUtil();
  const { FileManager, ScheduleDatePicker, ScheduleTimePicker } = useComponents();
  const [postQuote] = sh.usePostQuoteMutation();

  const { 
    GroupContext,
    GroupScheduleContext,
    GroupScheduleSelectionContext
  } = useContexts();

  const { 
    GroupSelect
  } = useContext(GroupContext) as GroupContextType;

  const { 
    groupSchedule,
    groupScheduleService,
    groupScheduleServiceTier,
    GroupScheduleSelect,
    GroupScheduleServiceSelect,
    GroupScheduleServiceTierSelect
  } = useContext(GroupScheduleContext) as GroupScheduleContextType;

  const { 
    quote,
    setQuote,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    firstAvailable,
    setStartOfMonth,
    dateSlots
  } = useContext(GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;

  const { 
    form: serviceForm,
    comp: ServiceForm,
    valid: serviceFormValid
  } = useGroupForm(groupScheduleService?.formId);

  const { 
    form: tierForm,
    comp: TierForm,
    valid: tierFormValid
  } = useGroupForm(groupScheduleServiceTier?.formId);

  const SelectTimeAccordion = useAccordion('Select Time');
  const GroupScheduleServiceAccordion = useAccordion((groupScheduleService?.name || '') + ' Questionnaire');
  const GroupScheduleServiceTierAccordion = useAccordion((groupScheduleServiceTier?.name || '') + ' Questionnaire');

  if (!groupSchedule || !groupScheduleService) return <Alert severity="info">
    There are no active schedules or operations are currently halted.
  </Alert>;

  return <>
    <Grid container spacing={2}>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Create Request"
            subheader="Request services from a group. Some fields may be required depending on the service."
            action={<GroupSelect />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <GroupScheduleSelect />
              </Grid>
              <Grid item xs={4}>
                <GroupScheduleServiceSelect />
              </Grid>
              <Grid item xs={4}>
                <GroupScheduleServiceTierSelect />
              </Grid>
            </Grid>

          </CardContent>
        </Card>

        <GroupScheduleServiceAccordion>
          <ServiceForm />
        </GroupScheduleServiceAccordion>

        <GroupScheduleServiceTierAccordion>
          <TierForm />
        </GroupScheduleServiceTierAccordion>

        <SelectTimeAccordion>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <ScheduleDatePicker
                key={groupSchedule.id || ''}
                dateSlots={dateSlots}
                firstAvailable={firstAvailable}
                bracketSlotDate={selectedDate || firstAvailable.time || null}
                setStartOfMonth={setStartOfMonth}
                onDateChange={(date: dayjs.Dayjs | null) => setSelectedDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date : null)}
              />
            </Grid>
            <Grid item xs={4}>
              <ScheduleTimePicker
                key={groupSchedule.id}
                scheduleId={groupSchedule.id}
                firstAvailable={firstAvailable}
                bracketSlotDate={selectedDate}
                value={selectedTime || firstAvailable.time}
                onTimeChange={({ time, quote: newQuote }: { time: dayjs.Dayjs | null, quote?: IQuote }) => {
                  setSelectedTime(time);
                  if (newQuote) {
                    setQuote({ ...quote, ...newQuote })
                  }
                }}
                onTimeAccept={(newQuote: IQuote) => {
                  setQuote({ ...quote, ...newQuote })
                }}
              />
            </Grid>
          </Grid>
        </SelectTimeAccordion>

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            async function go() {
              if (groupScheduleServiceTier) {
                quote.serviceTierId = groupScheduleServiceTier.id;

                if (!quote.scheduleBracketSlotId) {
                  const { scheduleBracketSlotId, startDate } = firstAvailable;
                  quote.scheduleBracketSlotId = scheduleBracketSlotId;
                  quote.slotDate = startDate;
                }

                if (!serviceFormValid || !tierFormValid) {
                  setSnack({ snackType: 'error', snackOn: 'Please ensure all required fields are filled out.' });
                  return;
                }

                await postQuote({
                  slotDate: quote.slotDate,
                  scheduleBracketSlotId: quote.scheduleBracketSlotId,
                  serviceTierId: quote.serviceTierId,
                  serviceForm: serviceForm ? {
                    formVersionId: serviceForm.version.id,
                    submission: serviceForm.version.submission
                  } : undefined,
                  tierForm: tierForm ? {
                    formVersionId: tierForm.version.id,
                    submission: tierForm.version.submission
                  } : undefined
                }).unwrap();
                setSnack({ snackOn: 'Your request has been made successfully!' });
                navigate('/');
              }
            }
            void go();
          }}>
            <Box m={2} sx={{ display: 'flex' }}>
              <Typography color="secondary" variant="button">Submit Request</Typography>
            </Box>
          </CardActionArea>
        </Card>
      </Grid>

    </Grid>
  </>

}

export default RequestQuote;