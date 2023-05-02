import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { IForm, IQuote, TimeUnit, IGroupScheduleDateSlots, quotedDT, userTimezone } from 'awayto/core';
import { useComponents, sh, useUtil, useSelectOne } from 'awayto/hooks';

export function RequestQuote(props: IProps): JSX.Element {

  const navigate = useNavigate();
  const { setSnack } = useUtil();
  const { FileManager, FormDisplay, ScheduleDatePicker, ScheduleTimePicker } = useComponents();

  const [getGroupFormById] = sh.useLazyGetGroupFormByIdQuery();
  const [postQuote] = sh.usePostQuoteMutation();

  // useEffect(() => {
  //   if (group.name && service.formId && service.formId != serviceForm.id) {
  //     getGroupFormById({ groupName: group.name, formId: service.formId }).unwrap().then(groupServiceForm => {
  //       setServiceForm(groupServiceForm);
  //     }).catch(console.error);
  //   }
  // }, [service, serviceForm, group]);

  // useEffect(() => {
  //   if (group.name && tier.formId && tier.formId != tierForm.id) {
  //     getGroupFormById({ groupName: group.name, formId: tier.formId }).unwrap().then(groupTierForm => {
  //       setTierForm(groupTierForm);
  //     }).catch(console.error);
  //   }
  // }, [tier, tierForm, group]);

  const { data: profile } = sh.useGetUserProfileDetailsQuery();

  const [group, GroupSelect] = useSelectOne('Groups', { data: Object.values(profile?.groups || {}) })

  const [groupSchedule, ScheduleSelect] = useSelectOne('Schedules', sh.useGetGroupSchedulesQuery({ groupName: group?.name || '' }, { skip: !group }));

  const { data: groupUserSchedules } = sh.useGetGroupUserSchedulesQuery({ groupName: group?.name || '', groupScheduleId: groupSchedule?.id || '' }, { skip: !group || !groupSchedule });

  const [service, ServiceSelect] = useSelectOne('Service', { data: groupUserSchedules?.flatMap(gus => Object.values(gus.brackets).flatMap(b => Object.values(b.services))) });

  const [tier, TierSelect] = useSelectOne('Tier', { data: Object.values(service?.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()) });

  const [startOfMonth, setStartOfMonth] = useState(dayjs().startOf(TimeUnit.MONTH));
  const { data: dateSlots } = sh.useGetGroupScheduleByDateQuery({
    groupName: group?.name || '',
    scheduleId: groupSchedule?.id || '',
    date: startOfMonth.format("YYYY-MM-DD"),
    timezone: btoa(userTimezone)
  }, { skip: !group || !groupSchedule });
  
  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs().startOf('day') } as IGroupScheduleDateSlots);
  if (dateSlots?.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
  }

  const [serviceForm, setServiceForm] = useState({} as IForm);
  const [tierForm, setTierForm] = useState({} as IForm);
  const [quote, setQuote] = useState({} as IQuote);

  const [bracketSlotDate, setBracketSlotDate] = useState<dayjs.Dayjs | null>();
  const [bracketSlotTime, setBracketSlotTime] = useState<dayjs.Dayjs | null>();

  // Re-add service tier addons component

  if (!groupSchedule) return <></>;
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
                <ScheduleSelect />
              </Grid>
              <Grid item xs={4}>
                <ServiceSelect />
              </Grid>
              <Grid item xs={4}>
                <TierSelect />
              </Grid>
            </Grid>

          </CardContent>
        </Card>

        {serviceForm.version && <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="service-request-section-service-questionnaire-content"
            id="service-request-section-service-questionnaire-header"
          >
            <Typography>{service?.name} Questionnaire</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormDisplay form={serviceForm} setForm={setServiceForm} />
          </AccordionDetails>
        </Accordion>}

        {tierForm.version && <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="service-request-section-tier-questionnaire-content"
            id="service-request-section-tier-questionnaire-header"
          >
            <Typography>{tier?.name} Questionnaire</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormDisplay form={tierForm} setForm={setTierForm} />
          </AccordionDetails>
        </Accordion>}

        <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="service-request-section-time-selection-content"
            id="service-request-section-time-selection-header"
          >
            <Typography>Schedule</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {groupSchedule && <Grid container spacing={2}>
              <Grid item xs={4}>
                <ScheduleDatePicker
                  key={groupSchedule.id}
                  dateSlots={dateSlots}
                  firstAvailable={firstAvailable}
                  bracketSlotDate={bracketSlotDate || firstAvailable.time || null}
                  setStartOfMonth={setStartOfMonth}
                  onDateChange={(date: dayjs.Dayjs | null) => setBracketSlotDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date  : null)}
                />
              </Grid>
              <Grid item xs={4}>
                <ScheduleTimePicker // removed the hiddenness of this when hours are not needed, need to move that idea into some component hide prop
                  key={groupSchedule.id}
                  scheduleId={groupSchedule.id}
                  firstAvailable={firstAvailable}
                  bracketSlotDate={bracketSlotDate}
                  value={bracketSlotTime || firstAvailable.time}
                  onTimeChange={({ time, quote: newQuote }: { time: dayjs.Dayjs | null, quote?: IQuote }) => {
                    setBracketSlotTime(time);
                    if (newQuote) {
                      setQuote({
                        ...quote,
                        ...newQuote
                      })
                    }
                  }}
                  onTimeAccept={(newQuote: IQuote) => {
                    setQuote({
                      ...quote,
                      ...newQuote
                    })
                  }}
                />
              </Grid>

              {/*
              TODO LATER SHOULD ONLY SHOW USER SELECTION BASED ON AUTO/ROUND-ROBIN/DIRECT-SELECT
              {quote.scheduleBracketSlotId && <Grid item xs={4}>
                <TextField
                  select
                  fullWidth
                  label="User"
                  value={quote.scheduleBracketSlotId}
                  onChange={e => {
                    setQuote({ ...quote, scheduleBracketSlotId: e.target.value })
                  }}
                >
                  {bracketsValues
                    .filter(bv => Object.values(bv.slots).findIndex(s => s.startTime === quote.slotTime) === -1)
                    .map((bv, i) => {
                      const { name } = Object.values(groupUserSchedules).find(gus => gus.userScheduleId === bv.scheduleId) || {};
                      return <MenuItem key={`schedule-slot-selection-${i}`} value={bv.id}>{name}</MenuItem>
                    })}
                </TextField>
              </Grid>} */}
            </Grid>}
          </AccordionDetails>
        </Accordion>

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            async function go() {
              if (tier) {
                quote.serviceTierId = tier.id;
    
                if (!quote.scheduleBracketSlotId) {
                  const { scheduleBracketSlotId, startDate } = firstAvailable;
                  quote.scheduleBracketSlotId = scheduleBracketSlotId;
                  quote.slotDate = startDate;
                }
    
                if (Object.keys(serviceForm).length) {
                  const missingValues = Object.keys(serviceForm.version.form).some(rowId => serviceForm.version.form[rowId].some((field, i) => field.r && [undefined, ''].includes(serviceForm.version.submission[rowId][i])));
                  if (missingValues) {
                    setSnack({ snackType: 'error', snackOn: 'The Service Questionnaire is missing required fields!' });
                    return;
                  }
                  quote.serviceForm = {
                    formVersionId: serviceForm.version.id,
                    submission: serviceForm.version.submission
                  }
                }
    
                if (Object.keys(tierForm).length) {
                  const missingValues = Object.keys(tierForm.version.form).some(rowId => tierForm.version.form[rowId].some((field, i) => field.r && [undefined, ''].includes(tierForm.version.submission[rowId][i])));
                  if (missingValues) {
                    setSnack({ snackType: 'error', snackOn: 'The Tier Questionnaire is missing required fields!' });
                    return;
                  }
                  quote.tierForm = {
                    formVersionId: tierForm.version.id,
                    submission: tierForm.version.submission
                  }
                }
    
                await postQuote(quote).unwrap();
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