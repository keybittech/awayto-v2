import React, { useEffect, useState, useMemo } from 'react';
import DataTable, { IDataTableColumn } from 'react-data-table-component';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import CheckIcon from '@material-ui/icons/Check';

import { IServiceActionTypes, IFormActionTypes, IScheduleActionTypes, ISchedule, IService, IServiceAddon, IServiceTier, IQuote, IContact, FileStoreStrategies } from 'awayto';
import { useApi, useRedux, useComponents } from 'awayto-hooks';

const { GET_SCHEDULES, GET_SCHEDULE_BY_ID } = IScheduleActionTypes;
const { GET_SERVICE_BY_ID } = IServiceActionTypes;
const { GET_FORMS } = IFormActionTypes;

const quoteSchema = {
  name: '',
  budgetId: '',
  timelineId: '',
  desiredDuration: 0,
  durationContext: '',
  respondBy: '',
  description: ''
}

const contactSchema = {
  name: '',
  email: '',
  phone: ''
}

export function BookingHome(props: IProps): JSX.Element {
  const { classes } = props;
  const api = useApi();
  const { FileManager } = useComponents();
  const { schedules } = useRedux(state => state.schedules);
  const { budgets, timelines, scheduleContexts } = useRedux(state => state.forms);

  const [schedule, setSchedule] = useState<ISchedule>();
  const [service, setService] = useState<IService>();
  const [tier, setTier] = useState<IServiceTier>();
  const [contact, setContact] = useState<IContact>({ ...contactSchema });
  const [quote, setQuote] = useState<IQuote>({ ...quoteSchema });
  const [serviceTierAddons, setServiceTierAddons] = useState<string[]>([]);

  useEffect(() => {
    void api(GET_SCHEDULES, true)
    // .then(() => {
    //   const id = Object.keys(schedules)[0];
    //   if (id) {
    //     void api(GET_SCHEDULE_BY_ID, true, { id }).then(res => {
    //       const sched = res as ISchedule;
    //       void api(GET_FORMS);
    //       // Here we'll use the response in this special case to get the deeply
    //       // structured object on first load, rather than wait for redux to update
    //       // otherwise we'd require a new useEffect watching the first object of schedules, bad
    //       if (sched) {
    //         setSchedule(sched);
    //         setService(sched.services[0]);
    //         setTier(sched.services[0].tiers[0])
    //       }
    //     });
    //   }
    // });
  }, []);

  useEffect(() => {
    const [id, ...rest] = Object.keys(schedules);
    if (id && !schedules[id].services) {
      void api(GET_SCHEDULE_BY_ID, true, { id }).then(res => {
        const [sched] = res as ISchedule[];
        void api(GET_FORMS);
        // Here we'll use the response in this special case to get the deeply
        // structured object on first load, rather than wait for redux to update
        // otherwise we'd require a new useEffect watching the first object of schedules, bad
        if (sched) {
          setSchedule(sched);
          setService(sched.services[0]);
          setTier(sched.services[0].tiers[0])
        }
      });
    }
  }, [schedules]);

  useEffect(() => {
    if (service?.tiers.length) {
      const addons = service.tiers.reduce<string[]>((memo, { addons }) => {
        if (addons) {
          for (let i = 0, v = addons.length; i < v; i++) {
            const { name } = addons[i];
            if (name && memo.indexOf(name) < 0) memo.push(name);
          }
        }
        return memo;
      }, []);

      setServiceTierAddons(addons);
    }
  }, [service]);

  const tierColumns = useMemo(() => {
    if (!service || !serviceTierAddons.length) return [];
    return [
      { name: '', selector: 'name' },
      ...service.tiers.reduce((memo, { name, addons }) => {
        memo.push({
          name: `${name}`,
          cell: row => {
            return addons.map(ad => ad.name).indexOf(row.name) > -1 ? <CheckIcon className={classes.green} /> : '--';
          }
        });
        return memo;
      }, [] as IDataTableColumn<IServiceAddon>[])
    ]
  }, [serviceTierAddons]);

  if (!schedule || !service || !tier || !scheduleContexts || !quote) return <>Check here after making a schedule...</>;

  return <Grid container spacing={2}>
    <Grid item xs={12}>
      <Card>
        <CardHeader title="Request a Quote" />
        <CardContent>

          <Box m={4}>
            <Grid container direction="row" spacing={8}>
              <Grid item xs={12}>
                <Grid container direction="column" spacing={6}>
                  <Grid item>
                    <TextField fullWidth label="Project Name" value={quote.name} onChange={e => setQuote({ ...quote, name: e.target.value })} />
                  </Grid>
                  <Grid item>
                    <Box mt={-4}>
                      <TextField fullWidth multiline minRows={4} InputProps={{ style: { minHeight: '100px' } }} label="Description" value={quote.description} onChange={e => setQuote({ ...quote, description: e.target.value })} />
                    </Box>
                  </Grid>

                  <Grid item>
                    <FileManager {...props} />
                  </Grid>

                  <Grid item>
                    <Grid container spacing={2}>

                      <TextField style={{ flex: '1' }} select label="Schedules" fullWidth value={schedule.id} onChange={e => {
                        void api(GET_SCHEDULE_BY_ID, true, { id: e.target.value })
                        // .then(res => {
                        //   if (res) {
                        //     setSchedule(res)
                        //     setService(res.services[0])
                        //     setTier(res.services[0].tiers[0])
                        //   }
                        // });
                      }}>
                        {Object.values(schedules)?.map((schedule, i) => {
                          return <MenuItem key={i} value={schedule.id}>{schedule.name}</MenuItem>
                        })}
                      </TextField>
                      <TextField style={{ flex: '1' }} select label="Service" fullWidth value={service.id} onChange={e => {
                        void api(GET_SERVICE_BY_ID, true, { id: e.target.value })
                        // .then(serv => {
                        //   if (serv) {
                        //     setService(serv);
                        //     setTier(serv.tiers[0])
                        //   }
                        // });
                      }}>
                        {schedule.services.map((service, i) => {
                          return <MenuItem key={i} value={service.id}>{service.name}</MenuItem>
                        })}
                      </TextField>
                      <TextField style={{ flex: '1' }} select label="Tier" fullWidth value={tier.id} onChange={e => {
                        setTier(service.tiers.find(t => t.id === e.target.value));
                      }}>
                        {service.tiers.map((tier, i) => {
                          return <MenuItem key={i} value={tier.id}>{tier.name}</MenuItem>
                        })}
                      </TextField>
                    </Grid>
                    <Box mt={6}>
                      <Card square>
                        {tierColumns.length > 0 && <DataTable title="Tier Addon Comparison" data={serviceTierAddons.map(name => ({ name }))} columns={tierColumns} />}
                      </Card>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Grid container direction="column" spacing={6}>

                  <Grid item>
                    <TextField fullWidth label="Contact Name" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} />
                  </Grid>

                  <Grid item>
                    <Grid container spacing={4}>
                      <Grid item style={{ flex: '2' }}>
                        <TextField fullWidth label="Email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                      </Grid>

                      <Grid item style={{ flex: '1' }}>
                        <TextField fullWidth label="Phone" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item>
                    <Box sx={{ display: 'flex' }}>
                      <TextField select label="Budget" fullWidth value={quote.budgetId} onChange={e => { setQuote({ ...quote, budgetId: e.target.value }) }}>
                        <MenuItem value="">No selection</MenuItem>
                        {budgets?.map((budget, i) => {
                          return <MenuItem key={i} value={budget.id}>{budget.name}</MenuItem>
                        })}
                      </TextField>
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      <TextField select label="Timeline" fullWidth value={quote.timelineId} onChange={e => { setQuote({ ...quote, timelineId: e.target.value }) }}>
                        <MenuItem value="">No selection</MenuItem>
                        {timelines?.map((timeline, i) => {
                          return <MenuItem key={i} value={timeline.id}>{timeline.name}</MenuItem>
                        })}
                      </TextField>
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex' }}>
                        <TextField label="Desired Duration" value={quote.desiredDuration} onChange={e => setQuote({ ...quote, desiredDuration: parseInt(e.target.value) })} type="number" />
                        <Typography>{schedule.brackets[0].scheduleContextName}</Typography>
                      </Box>
                      <Box>
                        Estimated Cost:
                        <Typography variant="h6">{service.cost * quote.desiredDuration * parseFloat(tier.multiplier) * parseFloat(schedule.brackets[0]!.multiplier)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  {quote.desiredDuration > 0 && <Box mt={8} m={4}>

                  </Box>}
                </Grid>
              </Grid>
            </Grid>
          </Box>

          <Box m={5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button style={{ alignSelf: 'flex-end' }} variant="text" color="primary">Submit</Button>
          </Box>
        </CardContent>
      </Card >

    </Grid>
  </Grid>

}

export default BookingHome;