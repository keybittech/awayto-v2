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
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { IService, IServiceTier, IForm, IQuote, ITimeUnitNames, TimeUnit, timeUnitOrder, IGroupScheduleDateSlots, quotedDT, userTimezone, IGroup } from 'awayto/core';
import { useComponents, sh, useUtil } from 'awayto/hooks';

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

  const { data: lookups } = sh.useGetLookupsQuery();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();

  const groupsValues = Object.values(profile?.groups || {});

  const [group, setGroup] = useState<IGroup | undefined>(groupsValues[0]);
  const groupName = group?.name || '';

  const { data: groupSchedules = [] } = sh.useGetGroupSchedulesQuery({ groupName }, { skip: !groupName });

  const [scheduleId, setScheduleId] = useState('');

  if (groupSchedules.length && !scheduleId) {
    setScheduleId(groupSchedules[0].id);
  }

  const { data: groupScheduleMaster } = sh.useGetGroupScheduleMasterByIdQuery({ groupName, scheduleId: scheduleId }, { skip: !groupName || !scheduleId });
  const timeUnitNames = lookups?.timeUnits.reduce((m, d) => {
    if (d.id === groupScheduleMaster?.scheduleTimeUnitId) {
      m.scheduleTimeUnitName = d.name;
    } else if (d.id === groupScheduleMaster?.bracketTimeUnitId) {
      m.bracketTimeUnitName = d.name;
    } else if (d.id === groupScheduleMaster?.slotTimeUnitId) {
      m.slotTimeUnitName = d.name;
    }
    return m;
  }, {} as { scheduleTimeUnitName: ITimeUnitNames; bracketTimeUnitName: ITimeUnitNames; slotTimeUnitName: ITimeUnitNames });

  const { data: groupUserSchedules = [] } = sh.useGetGroupUserSchedulesQuery({ groupName, groupScheduleId: scheduleId }, { skip: !groupName || !scheduleId });

  const services = groupUserSchedules?.flatMap(gus => Object.values(gus.brackets).flatMap(b => Object.values(b.services))) || [];

  const [service, setService] = useState<IService | undefined>();
  if (services.length && !service) {
    setService(services[0]);
  }

  const serviceTiers = Object.values(service?.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime());

  const [tier, setTier] = useState<IServiceTier | undefined>();
  if (serviceTiers.length && !tier) {
    setTier(serviceTiers[0]);
  }
  
  const [startOfMonth, setStartOfMonth] = useState(dayjs().startOf(TimeUnit.MONTH));
  const { data: dateSlots } = sh.useGetGroupScheduleByDateQuery({
    groupName,
    scheduleId,
    date: startOfMonth.format("YYYY-MM-DD"),
    timezone: btoa(userTimezone)
  }, { skip: !groupName || !scheduleId });
  
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

  return <>
    <Grid container spacing={2}>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Create Request"
            subheader="Request services from a group. Some fields may be required depending on the service."
            action={
              groupsValues.length && <TextField
                select
                value={group?.id}
                label="Group"
                onChange={e => setGroup(groupsValues.filter(g => g.id === e.target.value)[0])}
              >
                {groupsValues.map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
              </TextField>
            }
          />
          <CardContent>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                {scheduleId && <TextField
                  select
                  label="Schedules"
                  fullWidth
                  value={scheduleId}
                  onChange={e => {
                    if (e.target.value !== scheduleId) {
                      setScheduleId(e.target.value);
                    }
                  }}
                >
                  {groupSchedules.map((sched, i) => <MenuItem key={i} value={sched.id}>{sched.name}</MenuItem>)}
                </TextField>}
              </Grid>
              <Grid item xs={4}>
                {!!services.length && <TextField
                  select
                  label="Service"
                  fullWidth
                  value={service?.id}
                  onChange={e => {
                    const nextService = services.find(s => s.id === e.target.value);
                    if (nextService) {
                      setService(nextService);
                    }
                  }}
                >
                  {services.map((service, i) => <MenuItem key={`service_request_selection_${i}`} value={service.id}>{service.name}</MenuItem>)}
                </TextField>}
              </Grid>
              <Grid item xs={4}>
                {!!serviceTiers.length && <TextField
                  select
                  label="Level"
                  fullWidth
                  value={tier?.id}
                  onChange={e => {
                    setTier(serviceTiers.find(t => t.id === e.target.value) as IServiceTier);
                  }}
                >
                  {serviceTiers.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()).map((tier, i) => {
                    return <MenuItem key={i} value={tier.id}>{tier.name}</MenuItem>
                  })}
                </TextField>}
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
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <ScheduleDatePicker
                  key={scheduleId}
                  dateSlots={dateSlots}
                  firstAvailable={firstAvailable}
                  bracketSlotDate={bracketSlotDate || firstAvailable.time || null}
                  setStartOfMonth={setStartOfMonth}
                  onDateChange={(date: dayjs.Dayjs | null) => setBracketSlotDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date  : null)}
                />
              </Grid>
              {timeUnitNames && timeUnitOrder.indexOf(timeUnitNames.slotTimeUnitName) <= timeUnitOrder.indexOf(TimeUnit.HOUR) && <Grid item xs={4}>
                <ScheduleTimePicker
                  key={scheduleId}
                  firstAvailable={firstAvailable}
                  bracketSlotDate={bracketSlotDate}
                  bracketTimeUnitName={timeUnitNames.bracketTimeUnitName}
                  slotTimeUnitName={timeUnitNames.slotTimeUnitName}
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
              </Grid>}

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
            </Grid>
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