import React, { useEffect, useState, useMemo } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CheckIcon from '@mui/icons-material/Check';

import { IServiceActionTypes, IFormActionTypes, IScheduleActionTypes, ISchedule, IService, IServiceAddon, IServiceTier, IQuote, IContact } from 'awayto';
import { useApi, useRedux, useComponents } from 'awayto-hooks';

import { useStyles } from '../../../style';

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
  const classes = useStyles();
  const api = useApi();
  const { FileManager } = useComponents();
  const { schedules } = useRedux(state => state.schedule);
  const { budgets, timelines, scheduleContexts } = useRedux(state => state.forms);

  const [schedule, setSchedule] = useState<ISchedule>();
  const [service, setService] = useState<IService>();
  const [tier, setTier] = useState<IServiceTier>();
  const [contact, setContact] = useState<IContact>({ ...contactSchema });
  const [quote, setQuote] = useState<IQuote>({ ...quoteSchema });
  const [serviceTierAddons, setServiceTierAddons] = useState<string[]>([]);

  useEffect(() => {
    const [abort1] = api(GET_SCHEDULES, true)
    const [abort2] = api(GET_FORMS);
    return () => {
      abort1();
      abort2();
    }
  }, []);

  useEffect(() => {
    const [id] = Object.keys(schedules);
    if (id && !schedules[id].services) {
      const [abort, res] = api<ISchedule, ISchedule[]>(GET_SCHEDULE_BY_ID, true, { id })
      res?.then(data => {
        if (data) {
          const [sched] = data;
          setSchedule(sched);
          setService(sched.services?.at(0));
          setTier(sched.services?.at(0)?.tiers?.at(0))
        }
      });
      return () => abort();
    }
  }, [schedules]);

  useEffect(() => {
    if (service?.tiers?.length) {
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
      { name: '', selector: row => row.name } as TableColumn<IServiceAddon>,
      ...service.tiers.reduce((memo, { name, addons }) => {
        memo.push({
          name: `${name}`,
          cell: row => {
            return addons.map(ad => ad.name).indexOf(row.name) > -1 ? <CheckIcon className={classes.green} /> : '--';
          }
        });
        return memo;
      }, [] as TableColumn<IServiceAddon>[])
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
                      <Grid item xs={4}>
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
                      </Grid>
                      <Grid item xs={4}>
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
                      </Grid>
                      <Grid item xs={4}>
                        <TextField style={{ flex: '1' }} select label="Tier" fullWidth value={tier.id} onChange={e => {
                          setTier(service.tiers.find(t => t.id === e.target.value));
                        }}>
                          {service.tiers.map((tier, i) => {
                            return <MenuItem key={i} value={tier.id}>{tier.name}</MenuItem>
                          })}
                        </TextField>
                      </Grid>
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
                        <Typography variant="h6">{parseFloat(service.cost) * quote.desiredDuration * parseFloat(tier.multiplier) * parseFloat(schedule.brackets[0].multiplier)}</Typography>
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
            <Button sx={{ alignSelf: 'flex-end' }} variant="text" color="primary">Submit</Button>
          </Box>
        </CardContent>
      </Card >

    </Grid>
  </Grid>

}

export default BookingHome;