import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
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
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';

import {
  IGroupFormActionTypes,
  IGroupScheduleActionTypes,
  ISchedule,
  IService,
  IServiceAddon,
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
  userTimezone,
  getRelativeDuration,
  quotedDT
} from 'awayto';
import { useApi, useRedux, useComponents, useStyles, useAct } from 'awayto-hooks';
import { Duration, DurationUnitType } from 'dayjs/plugin/duration';
import { useNavigate } from 'react-router';

const { GET_GROUP_FORM_BY_ID } = IGroupFormActionTypes;
const { POST_QUOTE } = IQuoteActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { GET_GROUP_SCHEDULES, GET_GROUP_SCHEDULE_MASTER_BY_ID, GET_GROUP_SCHEDULE_BY_DATE } = IGroupScheduleActionTypes;
const { GET_GROUP_USER_SCHEDULES } = IGroupUserScheduleActionTypes;

export function RequestQuote(props: IProps): JSX.Element {
  const classes = useStyles();

  const api = useApi();
  const act = useAct();
  const navigate = useNavigate();
  const { FileManager, FormDisplay } = useComponents();
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const { groupUserSchedules } = useRedux(state => state.groupUserSchedule);
  const { groups } = useRedux(state => state.profile);
  const { timeUnits } = useRedux(state => state.lookup);
  const util = useRedux(state => state.util);

  const [serviceTierAddons, setServiceTierAddons] = useState<string[]>([]);
  const [services, setServices] = useState(new Map() as Map<string, IService>);
  const [schedule, setSchedule] = useState({ id: '' } as ISchedule);
  const [service, setService] = useState({ id: '', tiers: {} } as IService);
  const [tier, setTier] = useState({ id: '' } as IServiceTier);
  const [serviceForm, setServiceForm] = useState({} as IForm);
  const [tierForm, setTierForm] = useState({} as IForm);
  const [group, setGroup] = useState({ id: '' } as IGroup);
  const [quote, setQuote] = useState({} as IQuote);
  const [groupScheduleDateSlots, setGroupScheduleDateSlots] = useState([] as IGroupScheduleDateSlots[]);
  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs().startOf('day') } as IGroupScheduleDateSlots & { time: dayjs.Dayjs });

  const [bracketSlotDate, setBracketSlotDate] = useState<dayjs.Dayjs | null>();
  const [bracketSlotTime, setBracketSlotTime] = useState<dayjs.Dayjs | null>();

  const [monthSeekDate, setMonthSeekDate] = useState(dayjs().startOf(TimeUnit.MONTH));
  const [activeSchedule, setActiveSchedule] = useState('');

  const serviceTiers = useMemo(() => Object.values(service.tiers || {}), [service.tiers]);

  const tierColumns = useMemo(() => {
    if (!service || !tier || !serviceTierAddons.length) return [];
    return [
      { name: '', selector: row => row.name } as TableColumn<Partial<IServiceAddon>>,
      ...serviceTiers.reduce((memo, { name, addons }) => {
        memo.push({
          name: `${name}`,
          cell: row => {
            return Object.values(addons).map(ad => ad.name).indexOf(row.name as string) > -1 ? <Avatar sx={{ width: 24, height: 24, backgroundColor: 'white' }}><CheckIcon className={classes.green} /></Avatar> : '--';
          }
        });
        return memo;
      }, [] as TableColumn<Partial<IServiceAddon>>[])
    ]
  }, [serviceTierAddons, service, tier]);

  const bracketSlotDateDayDiff = useMemo(() => {
    if (bracketSlotDate) {
      const startOfDay = bracketSlotDate.startOf('day');
      return startOfDay.diff(startOfDay.day(0), TimeUnit.DAY);
    }
    return 0;
  }, [bracketSlotDate]);

  const loadSchedule = useCallback((sched: ISchedule) => {
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
    
    const sessionDuration = Math.round(getRelativeDuration(1, sched.bracketTimeUnitName, sched.slotTimeUnitName));
    sched.slotFactors = [];
    for (let value = 1; value < sessionDuration; value++) {
      if (sessionDuration % value === 0) {
        sched.slotFactors.push(value);
      }
    }
    
    setSchedule(sched);
  }, [timeUnits]);

  useEffect(()  => {
    if (groupUserSchedules.size) {
      let newServices = new Map() as Map<string, IService>;
      for (const sched of groupUserSchedules.values()) {
        newServices = new Map([ ...newServices, ...sched.services ]);
      }

      const someService = newServices.values().next().value as IService;
      const someServiceTiers = Object.values(someService.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime());

      setService(someService);
      setServices(newServices);
      setTier(someServiceTiers[0]);
    } 
  }, [groupUserSchedules]);

  useEffect(() => {
    if (group.name) {
      const [abort, res] = api(GET_GROUP_SCHEDULE_BY_DATE, {
        groupName: group.name,
        scheduleId: schedule.id,
        date: monthSeekDate.format("YYYY-MM-DD"),
        timezone: btoa(userTimezone)
      });
      res?.then(data => {
        const dateSlots = data as IGroupScheduleDateSlots[];
        if (dateSlots.length) {
          dateSlots.forEach(slot => {
            const slotDay = quotedDT(slot.weekStart, slot.startTime);
            slot.hour = slotDay.hour();
            slot.minute = slotDay.minute();
          });
          setGroupScheduleDateSlots(dateSlots);
          if (activeSchedule !== schedule.id) {
            const [slot] = dateSlots;
            setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
            setActiveSchedule(schedule.id);
          }
        } else {
          act(SET_SNACK, { snackType: 'warning', snackOn: 'There are no appointments for the selected month.' });
          setGroupScheduleDateSlots([]);
        }
      });
      return () => abort();
    }
  }, [group, schedule, monthSeekDate]);

  useEffect(() => {
    if (groups.size) {
      const gr = groups.values().next().value as IGroup;

      const [abort, res] = api(GET_GROUP_SCHEDULES, { groupName: gr.name })

      res?.then(data => {
        const scheds = data as IGroupSchedule[];
        const [, rez] = api(GET_GROUP_SCHEDULE_MASTER_BY_ID, { groupName: gr.name, scheduleId: scheds[0].id })
        rez?.then(data => {
          const [sched] = data as IGroupSchedule[];
          loadSchedule(sched);
          setGroup(gr);
        }).catch(console.warn);
      }).catch(console.warn);

      return () => abort();
    }
  }, [groups, timeUnits]);

  useEffect(() => {
    if (groupSchedules.size) {
      loadSchedule(groupSchedules.values().next().value as IGroupSchedule);
    }
  }, [groupSchedules, timeUnits]);

  useEffect(() => {
    if (group.name && schedule.id) {
      const [abort, res] = api(GET_GROUP_USER_SCHEDULES, { groupName: group.name, groupScheduleId: schedule.id });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [group, schedule]);

  useEffect(() => {
    if (group.name && service.formId && service.formId != serviceForm.id) {
      const [abort, res] = api(GET_GROUP_FORM_BY_ID, { groupName: group.name, formId: service.formId });
      res?.then(forms => {
        const [form] = forms as IForm[];
        setServiceForm(form);
      }).catch(console.warn);
      return () => abort();
    }
  }, [service, group]);

  useEffect(() => {
    if (group.name && tier.formId && tier.formId != tierForm.id) {
      const [abort, res] = api(GET_GROUP_FORM_BY_ID, { groupName: group.name, formId: tier.formId });
      res?.then(forms => {
        const [form] = forms as IForm[];
        setTierForm(form);
      }).catch(console.warn);
      return () => abort();
    }
  }, [tier, group]);

  useEffect(() => {
    if (serviceTiers.length) {
      const newAddons = serviceTiers
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

      setServiceTierAddons(newAddons);
    }
  }, [service]);

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
                onChange={e => setGroup(Array.from(groups.values()).filter(g => g.id === e.target.value)[0])}
              >
                {Array.from(groups.values()).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
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
                      const sched = groupSchedules.get(e.target.value);
                      if (sched) {
                        loadSchedule(sched);
                      }
                    }
                  }}
                >
                  {Array.from(groupSchedules.values()).map((sched, i) => <MenuItem key={i} value={sched.id}>{sched.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  label="Service"
                  fullWidth
                  value={service.id}
                  onChange={e => {
                    const serv = services.get(e.target.value);
                    if (serv) {
                      setService(serv);
                      setTier(serv.tiers[0]);
                    }
                  }}
                >
                  {Array.from(services.values()).map((service, i) => <MenuItem key={`service_request_selection_${i}`} value={service.id}>{service.name}</MenuItem>)}
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
            <DataTable
              theme={util.theme}
              columns={tierColumns}
              data={serviceTierAddons.map(name => ({ name }))}
            />
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
                <DesktopDatePicker
                  label="Date"
                  inputFormat="MM/DD/YYYY"
                  value={bracketSlotDate || firstAvailable.time || null}
                  minDate={firstAvailable.time}
                  onOpen={() => setMonthSeekDate(firstAvailable.time)}
                  onMonthChange={date => date && setMonthSeekDate(date)}
                  onYearChange={date => date && setMonthSeekDate(date)}
                  onChange={date => setBracketSlotDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date  : null)}
                  renderInput={(params) => <TextField {...params} />}
                  disableHighlightToday={true}
                  shouldDisableDate={date => {
                    if (date && groupScheduleDateSlots.length) {
                      return !groupScheduleDateSlots.filter(s => s.startDate === date.format("YYYY-MM-DD")).length;
                    }
                    return true;
                  }}
                />
              </Grid>
              {timeUnitOrder.indexOf(schedule.slotTimeUnitName) <= timeUnitOrder.indexOf(TimeUnit.HOUR) && <Grid item xs={4}>
                <TimePicker
                  label="Time"
                  value={bracketSlotTime || firstAvailable.time}
                  ampmInClock={true}
                  ignoreInvalidInputs={true}
                  onAccept={time => {
                    if (time) {
                      const currentSlotDate = bracketSlotDate || firstAvailable.time;

                      const timeHour = time.hour();
                      const timeMins = time.minute();
                      const duration = dayjs.duration(0)
                        .add(bracketSlotDateDayDiff, TimeUnit.DAY)
                        .add(timeHour, TimeUnit.HOUR)
                        .add(timeMins, TimeUnit.MINUTE);
                      const [slot] = groupScheduleDateSlots
                        .filter(s => s.startDate === currentSlotDate.format("YYYY-MM-DD") && duration.hours() === s.hour && duration.minutes() === s.minute);

                      if (slot) {
                        setQuote({
                          ...quote,
                          slotDate: currentSlotDate.format('YYYY-MM-DD'),
                          scheduleBracketSlotId: slot.scheduleBracketSlotId
                        });
                      }

                    }
                  }}
                  onChange={bracketSlotTime => setBracketSlotTime(bracketSlotTime)}
                  shouldDisableTime={(time, clockType) => {
                    if (groupScheduleDateSlots.length) {
                      const currentSlotTime = bracketSlotTime || firstAvailable.time;
                      const currentSlotDate = bracketSlotDate || firstAvailable.time;
                      // Ignore seconds check because final time doesn't need seconds, so this will cause invalidity
                      if ('seconds' === clockType) return false;
  
                      // Create a duration based on the current clock validation check and the days from start of current week
                      let duration: Duration = dayjs.duration(time, clockType).add(bracketSlotDateDayDiff, TimeUnit.DAY);
  
                      // Submitting a new time a two step process, an hour is selected, and then a minute. Upon hour selection, bracketSlotTime is first set, and then when the user selects a minute, that will cause this block to run, so we should add the existing hour from bracketSlotTime such that "hour + minute" will give us the total duration, i.e. 4:30 AM = PT4H30M
                      if ('minutes' === clockType && currentSlotTime) {
                        duration = duration.add(currentSlotTime.hour(), TimeUnit.HOUR);
                      }
  
                      // When checking hours, we need to also check the hour + next session time, because shouldDisableTime checks atomic parts of the clock, either hour or minute, but no both. So instead of keeping track of some ongoing clock, we can just check both durations here
                      const checkDurations: Duration[] = [duration];
                      if ('hours' === clockType) {
                        for (const factor of schedule.slotFactors) { 
                          checkDurations.push(duration.add(factor, schedule.slotTimeUnitName as DurationUnitType));
                        }
                      }
  
                      const matches = groupScheduleDateSlots.filter(s => s.startDate === currentSlotDate.format("YYYY-MM-DD") && checkDurations.filter(d => d.hours() === s.hour && d.minutes() === s.minute).length > 0);
                      // Checks that have no existing slots are invalid
                      return !matches.length;
                    }
                    return true;
                  }}
                  renderInput={params => <TextField {...params} />}
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

            if (serviceForm) {
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

            if (tierForm) {
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