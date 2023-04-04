import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
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
import CheckIcon from '@mui/icons-material/Check';

import {
  IGroupFormActionTypes,
  IGroupScheduleActionTypes,
  ISchedule,
  IService,
  IServiceTier,
  IForm,
  IGroup,
  IUtilActionTypes,
  IQuote,
  IQuoteActionTypes,
  ITimeUnitNames,
  IGroupSchedule,
  IGroupUserScheduleActionTypes,
  TimeUnit,
  timeUnitOrder,
  IGroupScheduleDateSlots,
  quotedDT
} from 'awayto/core';
import { useApi, useRedux, useComponents, useStyles, useAct, useGrid, storeApi } from 'awayto/hooks';
import { GridColDef } from '@mui/x-data-grid';

const { GET_GROUP_FORM_BY_ID } = IGroupFormActionTypes;
const { POST_QUOTE } = IQuoteActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { GET_GROUP_SCHEDULES, GET_GROUP_SCHEDULE_MASTER_BY_ID } = IGroupScheduleActionTypes;
const { GET_GROUP_USER_SCHEDULES } = IGroupUserScheduleActionTypes;

export function RequestQuote(props: IProps): JSX.Element {
  const classes = useStyles();

  const api = useApi();
  const act = useAct();
  const navigate = useNavigate();
  const { FileManager, FormDisplay, ScheduleDatePicker, ScheduleTimePicker } = useComponents();
  const { groupSchedules, dateSlots } = useRedux(state => state.groupSchedule);
  const { groupUserSchedules } = useRedux(state => state.groupUserSchedule);

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const { timeUnits } = useRedux(state => state.lookup);

  const [services, setServices] = useState({} as Record<string, IService>);
  const [schedule, setSchedule] = useState({ id: '' } as ISchedule);
  const [service, setService] = useState({ id: '', tiers: {} } as IService);
  const [tier, setTier] = useState({ id: '' } as IServiceTier);
  const [serviceForm, setServiceForm] = useState({} as IForm);
  const [tierForm, setTierForm] = useState({} as IForm);
  const [group, setGroup] = useState({ id: '' } as IGroup);
  const [quote, setQuote] = useState({} as IQuote);
  
  const [bracketSlotDate, setBracketSlotDate] = useState<dayjs.Dayjs | null>();
  const [bracketSlotTime, setBracketSlotTime] = useState<dayjs.Dayjs | null>();
  
  const [activeSchedule, setActiveSchedule] = useState('');
  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs().startOf('day') } as IGroupScheduleDateSlots);

  const groupsValues = useMemo(() => Object.values(profile.groups || {}), [profile]);
  const servicesValues = useMemo(() => Object.values(services || {}), [services]);
  const groupSchedulesValues = useMemo(() => Object.values(groupSchedules || {}), [groupSchedules]);
  const groupUserSchedulesValues = useMemo(() => Object.values(groupUserSchedules || {}), [groupUserSchedules]);

  const loadSchedule = useCallback((sched: ISchedule) => {
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;    
    setSchedule(sched);
  }, [timeUnits]);

  if (groupsValues.length && !group.id) {
    setGroup(groupsValues[0]);
  }

  if (schedule.id && activeSchedule !== schedule.id && dateSlots.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
    setActiveSchedule(schedule.id);
  }

  const serviceTiers = useMemo(() => Object.values(service.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()), [service.tiers]);

  if (serviceTiers.length && (!tier.id || !serviceTiers.map(t => t.id).includes(tier.id))) {
    setTier(serviceTiers[0]);
  }

  if (groupSchedulesValues.length && !schedule.id) {
    loadSchedule(groupSchedulesValues[0]);
  }

  const serviceTierAddons = useMemo(() => {
    return serviceTiers
      .sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())
      .reduce<string[]>((memo, { addons }) => {
        const serviceAddons = Object.values(addons);
        if (serviceAddons) {
          for (let i = 0, v = serviceAddons.length; i < v; i++) {
            const { name } = serviceAddons[i];
            if (memo.indexOf(name) < 0) memo.push(name);
          }
        }
        return memo;
      }, []);
  }, [serviceTiers]);

  const TierGrid = useGrid({
    rows: serviceTierAddons.map(name => ({ name })),
    columns: [
      { type: 'string', field: 'name', headerName: '' },
      ...serviceTiers.reduce((memo, { name, addons }) => {
        memo.push({
          headerName: name,
          field: '',
          renderCell: ({ row }) => {
            return Object.values(addons).map(ad => ad.name).indexOf(row.name) > -1 ? <Avatar sx={{ width: 24, height: 24, backgroundColor: 'white' }}><CheckIcon className={classes.green} /></Avatar> : '--';
          }
        });
        return memo;
      }, [] as GridColDef<{ name: string }>[])
    ]
  });

  useEffect(() => {
    if (group.name) {
      const [abort, res] = api(GET_GROUP_SCHEDULES, { groupName: group.name })
      res?.then(scheduleData => {
        const [sched] = scheduleData as IGroupSchedule[];
        if (sched) {
          const [, rez] = api(GET_GROUP_SCHEDULE_MASTER_BY_ID, { groupName: group.name, scheduleId: sched.id })
          rez?.then(masterSchedules => {
            const [masterSched] = masterSchedules as IGroupSchedule[];
            loadSchedule(masterSched);
          }).catch(console.warn);
        }
      }).catch(console.warn);
      return () => abort();
    }
  }, [group]);

  useEffect(() => {
    if (group.name && schedule.id) {
      const [abort, res] = api(GET_GROUP_USER_SCHEDULES, { groupName: group.name, groupScheduleId: schedule.id });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [group, schedule]);

  useEffect(() => {
    if (groupUserSchedulesValues.length && (!tier.id && !services.size && !service.id)) {
      let newServices = {} as Record<string, IService>;

      for (const schedId in groupUserSchedules) {
        const sched = groupUserSchedules[schedId];
        newServices = { ...newServices, ...sched.services };
      }

      setServices(newServices);
  
      const someService = Object.values(newServices)[0] || {};
      setService(someService);

      setTier(Object.values(someService.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())[0]);
    }
  }, [groupUserSchedules, tier, services, service]);

  useEffect(() => {
    if (group.name && service.formId && service.formId != serviceForm.id) {
      const [abort, res] = api(GET_GROUP_FORM_BY_ID, { groupName: group.name, formId: service.formId });
      res?.then(forms => {
        const [form] = forms as IForm[];
        setServiceForm(form);
      }).catch(console.warn);
      return () => abort();
    }
  }, [service, serviceForm, group]);

  useEffect(() => {
    if (group.name && tier.formId && tier.formId != tierForm.id) {
      const [abort, res] = api(GET_GROUP_FORM_BY_ID, { groupName: group.name, formId: tier.formId });
      res?.then(forms => {
        const [form] = forms as IForm[];
        setTierForm(form);
      }).catch(console.warn);
      return () => abort();
    }
  }, [tier, tierForm, group]);

  return <>
    <Grid container spacing={2}>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Create Request"
            subheader="Request services from a group. Some fields may be required depending on the service."
            action={
              <TextField
                select
                value={group.id}
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
                <TextField
                  select
                  label="Schedules"
                  fullWidth
                  value={schedule.id}
                  onChange={e => {
                    if (e.target.value !== schedule.id) {
                      const sched = groupSchedules[e.target.value];
                      if (sched) {
                        loadSchedule(sched);
                      }
                    }
                  }}
                >
                  {groupSchedulesValues.map((sched, i) => <MenuItem key={i} value={sched.id}>{sched.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  label="Service"
                  fullWidth
                  value={service.id}
                  onChange={e => {
                    const serv = services[e.target.value];
                    if (serv) {
                      setService(serv);
                    }
                  }}
                >
                  {servicesValues.map((service, i) => <MenuItem key={`service_request_selection_${i}`} value={service.id}>{service.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  label="Level"
                  fullWidth
                  value={tier.id}
                  onChange={e => {
                    setTier(serviceTiers.find(t => t.id === e.target.value) as IServiceTier);
                  }}
                >
                  {serviceTiers.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()).map((tier, i) => {
                    return <MenuItem key={i} value={tier.id}>{tier.name}</MenuItem>
                  })}
                </TextField>
              </Grid>
            </Grid>

          </CardContent>
        </Card>

        <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="tiers-and-features-content"
            id="tiers-and-features-header"
          >
            <Typography>Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TierGrid />
          </AccordionDetails>
        </Accordion>

        {serviceForm.version && <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="service-request-section-service-questionnaire-content"
            id="service-request-section-service-questionnaire-header"
          >
            <Typography>{service.name} Questionnaire</Typography>
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
            <Typography>{tier.name} Questionnaire</Typography>
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
                  key={schedule.id}
                  scheduleId={schedule.id}
                  groupName={group.name}
                  firstAvailable={firstAvailable}
                  value={bracketSlotDate || firstAvailable.time || null}
                  onDateChange={(date: dayjs.Dayjs | null) => setBracketSlotDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date  : null)}
                />
              </Grid>
              {timeUnitOrder.indexOf(schedule.slotTimeUnitName) <= timeUnitOrder.indexOf(TimeUnit.HOUR) && <Grid item xs={4}>
                <ScheduleTimePicker
                  key={schedule.id}
                  firstAvailable={firstAvailable}
                  bracketSlotDate={bracketSlotDate}
                  bracketTimeUnitName={schedule.bracketTimeUnitName}
                  slotTimeUnitName={schedule.slotTimeUnitName}
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
            quote.serviceTierId = tier.id;

            if (!quote.scheduleBracketSlotId) {
              const { scheduleBracketSlotId, startDate } = firstAvailable;
              quote.scheduleBracketSlotId = scheduleBracketSlotId;
              quote.slotDate = startDate;
            }

            if (Object.keys(serviceForm).length) {
              const missingValues = Object.keys(serviceForm.version.form).some(rowId => serviceForm.version.form[rowId].some((field, i) => field.r && [undefined, ''].includes(serviceForm.version.submission[rowId][i])));
              if (missingValues) {
                act(SET_SNACK, { snackType: 'error', snackOn: 'The Service Questionnaire is missing required fields!' });
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
                act(SET_SNACK, { snackType: 'error', snackOn: 'The Tier Questionnaire is missing required fields!' });
                return;
              }
              quote.tierForm = {
                formVersionId: tierForm.version.id,
                submission: tierForm.version.submission
              }
            }

            const [, res] = api(POST_QUOTE, quote);
            res?.then(() => {
              act(SET_SNACK, { snackOn: 'Your request has been made successfully!' });
              navigate('/');
            })
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