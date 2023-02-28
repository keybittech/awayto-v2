import React, { useEffect, useState, useMemo } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useParams } from 'react-router';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';

import { ILookupActionTypes, IScheduleActionTypes, IGroupFormActionTypes, ISchedule, IService, IServiceAddon, IServiceTier, IQuote, IContact, IForm } from 'awayto';
import { useApi, useRedux, useComponents, useStyles } from 'awayto-hooks';

const { GET_GROUP_FORM_BY_ID } = IGroupFormActionTypes;
const { GET_SCHEDULES, GET_SCHEDULE_BY_ID } = IScheduleActionTypes;
const { GET_LOOKUPS } = ILookupActionTypes;

export function BookingHome(props: IProps): JSX.Element {
  const classes = useStyles();
  const { groupName } = useParams();

  const api = useApi();
  const { FileManager, FormDisplay } = useComponents();
  const util = useRedux(state => state.util);
  const { schedules } = useRedux(state => state.schedule);

  const [schedule, setSchedule] = useState({} as ISchedule);
  const [services, setServices] = useState<Record<string, IService>>({});
  const [service, setService] = useState({} as IService);
  const [tier, setTier] = useState({} as IServiceTier);
  const [contact, setContact] = useState({} as IContact);
  const [quote, setQuote] = useState({} as IQuote);
  const [serviceTierAddons, setServiceTierAddons] = useState<string[]>([]);
  const [serviceForm, setServiceForm] = useState({} as IForm);
  const [tierForm, setTierForm] = useState({} as IForm);

  useEffect(() => {
    const [abort1, res] = api(GET_SCHEDULES)
    res?.catch(console.warn);
    const [abort2, rez] = api(GET_LOOKUPS);
    rez?.catch(console.warn);
    return () => {
      abort1();
      abort2();
    }
  }, []);

  useEffect(() => {
    if (service.formId && service.formId != serviceForm.id) {
      const [abort, res] = api(GET_GROUP_FORM_BY_ID, { groupName, formId: service.formId });
      res?.then(forms => {
        const [form] = forms as IForm[];
        setServiceForm(form);
      }).catch(console.warn);
      return () => abort();
    }
  }, [service]);

  useEffect(() => {
    if (tier.formId && tier.formId != tierForm.id) {
      const [abort, res] = api(GET_GROUP_FORM_BY_ID, { groupName, formId: tier.formId });
      res?.then(forms => {
        const [form] = forms as IForm[];
        setTierForm(form);
      }).catch(console.warn);
      return () => abort();
    }
  }, [tier]);

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
    const [id] = Object.keys(schedules);
    if (id && !schedules[id].brackets) {
      const [abort, res] = api<ISchedule, ISchedule[]>(GET_SCHEDULE_BY_ID, { id }, { load: true })
      res?.then(data => {
        const [sched] = data;
        setSchedule(sched);

        for (const b in sched.brackets) {
          const bracketServices = sched.brackets[b].services;
          setServices(bracketServices);
          for (const s in bracketServices) {
            setService(bracketServices[s]);
            setTier(Object.values(bracketServices[s].tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())[0]);
            break;
          }
          break;
        }
      }).catch(console.warn);
      return () => abort();
    }
  }, [schedules]);

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
    {schedule.brackets && <Grid container spacing={2}>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Service Booking" />
          <CardContent>

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField style={{ flex: '1' }} select label="Schedules" fullWidth value={schedule.id} onChange={e => {
                  void api(GET_SCHEDULE_BY_ID, { id: e.target.value })
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
                  const serv = services[e.target.value];
                  setService(serv);
                  setTier(serv.tiers[0]);
                }}>
                  {Object.values(services).map((service, i) => {
                    return <MenuItem key={`booking_service_selection_${i}`} value={service.id}>{service.name}</MenuItem>
                  })}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField style={{ flex: '1' }} select label="Tier" fullWidth value={tier.id} onChange={e => {
                  setTier(serviceTiers.find(t => t.id === e.target.value) as IServiceTier);
                }}>
                  {serviceTiers.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()).map((tier, i) => {
                    return <MenuItem key={i} value={tier.id}>{tier.name}</MenuItem>
                  })}
                </TextField>
              </Grid>
            </Grid>

          </CardContent>
        </Card>

        <Accordion>
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
        
        {serviceForm.version && <Accordion>
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

        {tierForm.version && <Accordion>
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

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            console.log({ booking: true })
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