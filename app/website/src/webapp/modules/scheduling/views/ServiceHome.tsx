import React, { useEffect, useState } from 'react';

import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';

import { IService, IServiceActionTypes, IServiceTier, IServiceAddonActionTypes, IUtilActionTypes, IFormActionTypes } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';

import { useStyles } from '../../../style';

const { GET_SERVICES, DELETE_SERVICE, POST_SERVICE } = IServiceActionTypes;
const { POST_SERVICE_ADDON, DELETE_SERVICE_ADDON } = IServiceAddonActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { GET_FORMS } = IFormActionTypes;

const serviceSchema = {
  name: '',
  cost: '',
  tiers: []
};

const serviceTierSchema = {
  name: '',
  multiplier: '1.00',
  addons: []
};

const validCost = function (cost: string): boolean {
  return /(^$|^\$?\d+(,\d{3})*(\.\d*)?$)/.test(cost);
}

export function ServiceHome(props: IProps): JSX.Element {
  const classes = useStyles();
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const [newService, setNewService] = useState<IService>({ ...serviceSchema });
  const [newServiceTier, setNewServiceTier] = useState<IServiceTier>({ ...serviceTierSchema });
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);

  const { services } = useRedux(state => state.service);
  const { serviceAddons } = useRedux(state => state.forms);

  useEffect(() => {
    const [abort] = api(GET_SERVICES, true);
    return () => abort();
  }, []);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card>
        <CardHeader title="Service" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Box mx={4}>
            <Typography variant="body2">A service is the base level object that will be offered for sale to your users. Services can have tiers and features, which can increase the cost of the base service via a multiplier on the tier. Or create a base tier and add all</Typography>
            <Typography variant="h6">Current Services: <Typography style={{ verticalAlign: 'middle' }} variant="caption">{Object.values(services).map(({ id, name }, i) => <Chip key={`del_serv_${i}`} label={name} onDelete={() => {
              console.log('deleting', id)

              void api(DELETE_SERVICE, true, { id });
            }}></Chip>)}</Typography></Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Create Service" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              <Box mb={4}>
                <TextField fullWidth label="Name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} helperText="Ex: Website Hosting, Yard Maintenance, Automotive Repair" />
              </Box>

              <Box>
                <TextField fullWidth label="Cost" value={newService.cost || ''} onChange={e => validCost(e.target.value) && setNewService({ ...newService, cost: e.target.value })} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              <Box mb={4}>
                <Typography variant="h6">Add Tier</Typography>
                <Typography variant="body1">Some services divide their offering up into tiers. For example, a "Basic" tier may some basic features, and the "Advanced" tier has more features. You should have at least 1 tier which describes the features offered by your service. During booking, your users will see the information.</Typography>
              </Box>

              <Box mb={4}>
                {/* <Typography variant="body2">Some services divide their offering up into tiers. For example, a "Basic" tier may some basic features, and the "Advanced" tier has more features. If your service has no tier, you can ignore this section and we'll create a standard tier for you.</Typography> */}
                <TextField fullWidth label="Name" value={newServiceTier.name} onChange={e => setNewServiceTier({ ...newServiceTier, name: e.target.value })} helperText="Ex: Standard, Basic, Advanced" />
              </Box>

              <Box mb={4} sx={{ display: 'flex', alignItems: 'baseline' }}>
                <SelectLookup lookupName="Feature" lookups={serviceAddons} lookupChange={(val: string[]) => {
                  const sa = serviceAddons.filter(s => val.includes(s.id as string)).map(s => s.id as string);
                  setServiceTierAddonIds([ ...sa ])
                }} lookupValue={serviceTierAddonIds} multiple createActionType={POST_SERVICE_ADDON} deleteActionType={DELETE_SERVICE_ADDON} refetchAction={GET_FORMS} {...props} />
              </Box>

              <Box>
                <Typography variant="h6">Multiplier</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <span>{newServiceTier.multiplier}x <span>&nbsp;</span> &nbsp;</span>
                  <Slider value={parseFloat(newServiceTier.multiplier)} onChange={(e, val) => setNewServiceTier({ ...newServiceTier, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        <CardActionArea onClick={() => {
          if (newServiceTier.name) {
            newServiceTier.addons = serviceTierAddonIds?.map(id => ({ name: serviceAddons.find(sa => sa.id === id)?.name as string }));
            newService.tiers?.push(newServiceTier);
            setNewServiceTier({ ...serviceTierSchema });
            setServiceTierAddonIds([]);
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a tier name.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="button">Add to Service</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
    
    <Grid item xs={12}>
      <Card>
        <CardContent sx={{ padding: '0 15px' }}>
          <Box mb={4}>
            <Typography variant="h6">Tiers</Typography>
            <Typography variant="body1">The order that tiers appear here is the order they will be listed during booking.</Typography>
            <Box mt={4} sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {newService.tiers?.map((tier, i) => {
                return <Box key={`service-tier-chip${i + 1}new`} m={1}><Chip classes={{ root: classes.chipRoot, label: classes.chipLabel }} label={<Typography>{`#${i + 1} ` + tier.name + ' (' + tier.multiplier + 'x): ' + (tier.addons.length ? tier.addons.map(a => a.name).join(', ') : 'No features.')}</Typography>} onDelete={() => {
                  setNewService({ ...newService, tiers: newService.tiers?.filter(t => t.name !== tier.name) });
                }} /></Box>
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card>
        <CardActionArea onClick={() => {
          if (newService.name && newService.tiers?.length) {
            const [,res] = api(POST_SERVICE, true, { ...newService })
            if (res) {
              void res.then(() => {
                act(SET_SNACK, { snackOn: 'Successfully added ' + (newService.name || ''), snackType: 'info' });
                setNewService({ ...serviceSchema, tiers: [] });
                setServiceTierAddonIds([]);
              });
            }
            
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a service name, cost and at least 1 tier.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="button">Create</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  </Grid>
}

export default ServiceHome;