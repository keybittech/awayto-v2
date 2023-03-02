import React, { useEffect, useState, useMemo, useCallback } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';

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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
  TimeUnit,
  timeUnitOrder,
  weekFields,
  IGroupSchedule,
  IGroupUserScheduleActionTypes,
  chronoTimeUnits
} from 'awayto';
import { useApi, useRedux, useComponents, useStyles, useAct } from 'awayto-hooks';
import { ChronoUnit, DateTimeFormatter, TemporalAdjusters, Duration, ChronoField } from '@js-joda/core';

const { GET_GROUP_FORM_BY_ID } = IGroupFormActionTypes;
const { POST_QUOTE } = IQuoteActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { GET_GROUP_SCHEDULES, GET_GROUP_SCHEDULE_MASTER_BY_ID } = IGroupScheduleActionTypes;
const { GET_GROUP_USER_SCHEDULES } = IGroupUserScheduleActionTypes;

export function BookingHome(props: IProps): JSX.Element {
  const classes = useStyles();

  const api = useApi();
  const act = useAct();
  const { FileManager, FormDisplay } = useComponents();
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const { groupUserSchedules } = useRedux(state => state.groupUserSchedule);
  const { groups } = useRedux(state => state.profile);
  const { timeUnits } = useRedux(state => state.lookup);
  const util = useRedux(state => state.util);

  const [schedule, setSchedule] = useState({} as ISchedule);
  const [services, setServices] = useState<Record<string, IService>>({});
  const [service, setService] = useState({} as IService);
  const [tier, setTier] = useState({} as IServiceTier);
  const [serviceTierAddons, setServiceTierAddons] = useState<string[]>([]);
  const [serviceForm, setServiceForm] = useState({} as IForm);
  const [tierForm, setTierForm] = useState({} as IForm);
  const [group, setGroup] = useState({ id: '' } as IGroup);
  const [quote, setQuote] = useState({} as IQuote);

  const temporalAdjuster = TemporalAdjusters.previousOrSame(weekFields.firstDayOfWeek());

  useEffect(() => {
    if (groups) {
      for (const g in groups) {
        const [abort, res] = api(GET_GROUP_SCHEDULES, { groupName: groups[g].name })
        res?.then(data => {
          const scheds = data as IGroupSchedule[];
          const [, rez] = api(GET_GROUP_SCHEDULE_MASTER_BY_ID, { groupName: groups[g].name, scheduleId: scheds[0].id })
          rez?.then(data => {
            const [sched] = data as IGroupSchedule[];
            loadSchedule(sched);
            setGroup(groups[g]);
          }).catch(console.warn);
        }).catch(console.warn);
        return () => abort();
      }
    }
  }, [groups]);

  const loadSchedule = useCallback((sched: ISchedule) => {
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
    setSchedule(sched);
  }, [timeUnits]);

  useEffect(() => {
    if (Object.keys(groupSchedules).length) {
      for (const gs in groupSchedules) {
        loadSchedule(groupSchedules[gs]);
        break;
      }
    }
  }, [groupSchedules]);

  useEffect(() => {
    if (group.name && schedule.id) {
      const [abort] = api(GET_GROUP_USER_SCHEDULES, { groupName: group.name, groupScheduleId: schedule.id });
      return () => abort();
    }
  }, [group, schedule]);

  const bracketsValues = useMemo(() => {
    if (Object.keys(groupUserSchedules).length) {
      const brackets = Object.keys(groupUserSchedules).flatMap(s => Object.values(groupUserSchedules[s].brackets));

      const newServices = {} as Record<string, IService>;
      let someService = {} as IService;

      brackets.forEach(bracket => {
        for (const s in bracket.services) {
          newServices[s] = bracket.services[s];
          someService = bracket.services[s];
        }
      });

      setService(someService);
      setServices(newServices);
      setTier(Object.values(someService.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())[0]);

      return brackets;
    }
    return [];
  }, [groupUserSchedules]);

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

  const serviceTiers = useMemo(() => Object.values(service?.tiers || {}), [service?.tiers]);

  const tierColumns = useMemo(() => {
    if (!service || !tier || !serviceTierAddons.length) return [];
    return [
      { name: '', selector: row => row.name } as TableColumn<Partial<IServiceAddon>>,
      ...Object.values(service.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()).reduce((memo, { name, addons }) => {
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

  useEffect(() => {
    if (serviceTiers.length) {
      const newAddons = serviceTiers.sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()).reduce<string[]>((memo, { addons }) => {
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
    {!!bracketsValues.length && group.name && <Grid container spacing={2}>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Service Booking"
            subheader="Request services from a group. Different services may have required information to submit the request, so be sure to check."
            action={
              <TextField
                select
                value={group.id}
                label="Group"
                onChange={e => setGroup(Object.values(groups).filter(g => g.id === e.target.value)[0])}
              >
                {Object.values(groups).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
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
                      loadSchedule(groupSchedules[e.target.value]);
                    }
                  }}
                >
                  {Object.values(groupSchedules)?.map((sched, i) => {
                    return <MenuItem key={i} value={sched.id}>{sched.name}</MenuItem>
                  })}
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
                    setService(serv);
                    setTier(serv.tiers[0]);
                  }}
                >
                  {Object.values(services).map((service, i) => {
                    return <MenuItem key={`booking_service_selection_${i}`} value={service.id}>{service.name}</MenuItem>
                  })}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  select
                  label="Tier"
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
            <Typography>Tiers & Features</Typography>
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
            aria-controls="service-booking-section-service-questionnaire-content"
            id="service-booking-section-service-questionnaire-header"
          >
            <Typography>Service Questionnaire</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormDisplay form={serviceForm} setForm={setServiceForm} />
          </AccordionDetails>
        </Accordion>}

        {tierForm.version && <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="service-booking-section-tier-questionnaire-content"
            id="service-booking-section-tier-questionnaire-header"
          >
            <Typography>Tier Questionnaire</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormDisplay form={tierForm} setForm={setTierForm} />
          </AccordionDetails>
        </Accordion>}

        {tierForm.version && <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="service-booking-section-time-selection-content"
            id="service-booking-section-time-selection-header"
          >
            <Typography>Time Selection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <DatePicker
                  label="Date"
                  value={quote.jodaDate}
                  onChange={value => {
                    if (value) {
                      setQuote({ ...quote, jodaDate: value, slotDate: value.format(DateTimeFormatter.ofPattern('yyyy-MM-dd')) });
                    }
                  }}
                  shouldDisableDate={date => {
                    const bracketsHasDate = bracketsValues.some(b => {
                      let found = false;
                      for (const s in b.slots) {
                        const check = date.with(temporalAdjuster).plus(Duration.parse(b.slots[s].startTime).toDays(), ChronoUnit.DAYS);
                        if (0 === date.compareTo(check)) {
                          found = true;
                          break;
                        }
                      }
                      return found;
                    });
                    return !bracketsHasDate;
                  }}
                  renderInput={params => <TextField {...params} />}
                />
              </Grid>
              {quote.jodaDate && timeUnitOrder.indexOf(schedule.slotTimeUnitName) <= timeUnitOrder.indexOf(TimeUnit.HOUR) && <Grid item xs={4}>
                <TimePicker
                  label="Time"
                  value={quote.jodaTime}
                  ignoreInvalidInputs={true}
                  onChange={value => {
                    if (value) {
                      setQuote({ ...quote, jodaTime: quote.jodaDate.truncatedTo(ChronoUnit.DAYS).plusHours(value.get(ChronoField.HOUR_OF_DAY)).plusMinutes(value.get(ChronoField.MINUTE_OF_HOUR)) });
                    }
                  }}
                  shouldDisableTime={(time, clockType) => {
                    if (quote.jodaDate) {
                      const chronoUnit = chronoTimeUnits[clockType.slice(0, clockType.length - 1) as ITimeUnitNames];
                      
                      if (ChronoUnit.SECONDS === chronoUnit) return false;

                      const truncatedJodaDate = quote.jodaDate.truncatedTo(ChronoUnit.DAYS);
                      let date = truncatedJodaDate.plus(time, chronoUnit);

                      if (ChronoUnit.MINUTES === chronoUnit) {
                        date = date.plusHours(quote.jodaTime.get(ChronoField.HOUR_OF_DAY))
                      }

                      const bracketsHasTime = bracketsValues.some(b => {
                        let found = false;
                        for (const s in b.slots) {
                          const check = truncatedJodaDate.with(temporalAdjuster).plus(Duration.parse(b.slots[s].startTime));
                          if (date.equals(check)) {
                            found = true;
                            break;
                          }
                        }
                        return found;
                      });
                      return !bracketsHasTime;
                    }
                    return false;
                  }}
                  renderInput={params => <TextField {...params} />}
                />
              </Grid>}

              {/* can add person here */}
            </Grid>
          </AccordionDetails>
        </Accordion>}

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            quote.serviceTierId = tier.id;

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
            res?.then(quotes => {
              const [savedQuote] = quotes as IQuote[];

              console.log({ QUOTEID: savedQuote.id, SERVICEFORMSUBMISSIONID: savedQuote.serviceForm?.id, TIERFORMSUBMISSIONID: savedQuote.tierForm?.id })
            })
          }}>
            <Box m={2} sx={{ display: 'flex' }}>
              <Typography color="secondary" variant="button">Submit Booking</Typography>
            </Box>
          </CardActionArea>
        </Card>
      </Grid>

    </Grid>}
  </>

}

export default BookingHome;