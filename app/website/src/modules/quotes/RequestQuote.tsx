import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { GridColDef } from '@mui/x-data-grid';
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

import { DataGrid } from '@mui/x-data-grid';

import { ISchedule, IService, IServiceTier, IForm, IGroup, IQuote, ITimeUnitNames, TimeUnit, timeUnitOrder, IGroupScheduleDateSlots, quotedDT } from 'awayto/core';
import { useComponents, useStyles, useGrid, sh, useUtil } from 'awayto/hooks';

export function RequestQuote(props: IProps): JSX.Element {
  const classes = useStyles();

  const { setSnack } = useUtil();
  const [getGroupFormById] = sh.useLazyGetGroupFormByIdQuery();
  const [postQuote] = sh.usePostQuoteMutation();
  const [getGroupSchedules, { data: groupSchedules }] = sh.useLazyGetGroupSchedulesQuery();
  const [getGroupScheduleMasterById] = sh.useLazyGetGroupScheduleMasterByIdQuery();
  const [getGroupUserSchedules, { data: groupUserSchedules }] = sh.useLazyGetGroupUserSchedulesQuery();

  const navigate = useNavigate();
  const { FileManager, FormDisplay, ScheduleDatePicker, ScheduleTimePicker } = useComponents();

  const [_, { data: dateSlots }] = sh.useLazyGetGroupScheduleByDateQuery();

  const { data: lookups } = sh.useGetLookupsQuery();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();

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

  const groupsValues = useMemo(() => Object.values(profile?.groups || {}), [profile]);
  const servicesValues = useMemo(() => Object.values(services || {}), [services]);

  const loadSchedule = useCallback((sched: ISchedule) => {
    sched.scheduleTimeUnitName = lookups?.timeUnits?.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = lookups?.timeUnits?.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = lookups?.timeUnits?.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;    
    setSchedule(sched);
  }, [lookups]);

  if (groupsValues.length && !group.id) {
    setGroup(groupsValues[0]);
  }

  if (schedule.id && activeSchedule !== schedule.id && dateSlots?.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
    setActiveSchedule(schedule.id);
  }

  const serviceTiers = useMemo(() => Object.values(service.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()), [service.tiers]);

  if (serviceTiers.length && (!tier.id || !serviceTiers.map(t => t.id).includes(tier.id))) {
    setTier(serviceTiers[0]);
  }

  if (groupSchedules?.length && !schedule.id) {
    loadSchedule(groupSchedules[0]);
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

  const tierGridProps = useGrid({
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
    async function go() {
      const [firstGroupSchedule] = await getGroupSchedules({ groupName: group.name }).unwrap();
      if (firstGroupSchedule) {
        const masterSchedule = await getGroupScheduleMasterById({ groupName: group.name, scheduleId: firstGroupSchedule.id }).unwrap();
        loadSchedule(masterSchedule);
      }
    }
    if (group.name) {
      void go();
    }
  }, [group]);

  useEffect(() => {
    if (group.name && schedule.id) {
      getGroupUserSchedules({ groupName: group.name, groupScheduleId: schedule.id }).catch(console.error);
    }
  }, [group, schedule]);

  useEffect(() => {
    if (groupUserSchedules?.length && (!tier.id && !Object.keys(services).length && !service.id)) {
      let newServices = {} as Record<string, IService>;

      for (const sched of groupUserSchedules) {
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
      getGroupFormById({ groupName: group.name, formId: service.formId }).unwrap().then(groupServiceForm => {
        setServiceForm(groupServiceForm);
      }).catch(console.error);
    }
  }, [service, serviceForm, group]);

  useEffect(() => {
    if (group.name && tier.formId && tier.formId != tierForm.id) {
      getGroupFormById({ groupName: group.name, formId: tier.formId }).unwrap().then(groupTierForm => {
        setTierForm(groupTierForm);
      }).catch(console.error);
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
                      const sched = groupSchedules?.find(gs => gs.id === e.target.value);
                      if (sched) {
                        loadSchedule(sched);
                      }
                    }
                  }}
                >
                  {groupSchedules?.map((sched, i) => <MenuItem key={i} value={sched.id}>{sched.name}</MenuItem>)}
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
            <DataGrid {...tierGridProps} />
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
            async function go() {
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