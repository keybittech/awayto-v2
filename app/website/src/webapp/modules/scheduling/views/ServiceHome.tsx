import React, { useEffect, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';

import { IService, IServiceActionTypes, IServiceTier, IServiceAddonActionTypes, IUtilActionTypes } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';

const { GET_SERVICES, DELETE_SERVICE, POST_SERVICE } = IServiceActionTypes;
const { POST_SERVICE_ADDON, DELETE_SERVICE_ADDON } = IServiceAddonActionTypes;
const { SET_SNACK } = IUtilActionTypes;

const serviceSchema = {
  name: '',
  cost: 0,
  tiers: []
};

const serviceTierSchema = {
  name: '',
  multiplier: '1.00',
  addons: []
};

export function ServiceHome(props: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const [newService, setNewService] = useState<IService>({ ...serviceSchema });
  const [newServiceTier, setNewServiceTier] = useState<IServiceTier>({ ...serviceTierSchema });
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);

  const { services } = useRedux(state => state.services);
  const { serviceAddons } = useRedux(state => state.forms);

  useEffect(() => {
    void api(GET_SERVICES, true);
  }, []);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card>
        <CardHeader title="Service" />
        <CardContent>
          <Box mx={4}>
            <Typography variant="body1">A service is the base level object that will be offered for sale to your users. Services can have tiers and addons, which can increase the cost of the base service via a multiplier on the tier.</Typography>
            <Typography variant="h6">Current Services: <Typography style={{ verticalAlign: 'middle' }} variant="caption">{Object.values(services).map(({ id, name }, i) => <Chip key={`del_serv_${i}`} label={name} onDelete={() => {
              console.log('deleting', id)
              
              void api(DELETE_SERVICE, true, { id });
            }}></Chip>)}</Typography></Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Create Service" />
        <CardContent style={{ minHeight: '40vh' }}>
          <Box m={4}>
            <TextField fullWidth label="Name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} helperText="Ex: Website Hosting, Yard Maintenance, Automotive Repair" />
          </Box>

          <Box m={4}>
            <TextField fullWidth label="Cost" value={newService.cost} onChange={e => setNewService({ ...newService, cost: parseInt(e.target.value || '0') })} type="number" />
          </Box>

          <Box m={4}>
            <Typography variant="h6">Tiers <Typography variant="caption">The order that tiers appear here is the order they will be listed during booking.</Typography></Typography>
            <Box mt={4} sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {newService.tiers?.map((tier, i) => {
                return <Box key={`service-tier-chip${i + 1}new`} m={1}><Chip label={tier.name + ' (' + tier.multiplier + 'x): ' + (tier.addons.length ? tier.addons.map(a => a.name).join(', ') : 'No addons.')} onDelete={() => {
                  setNewService({ ...newService, tiers: newService.tiers?.filter(t => t.name !== tier.name) });
                }} /></Box>
              })}
            </Box>
          </Box>
        </CardContent>
        <CardActionArea onClick={() => {
          if (newService.name && newService.tiers.length) {
            void api(POST_SERVICE, true, { ...newService }).then(() => {
              void act(SET_SNACK, { snackOn: 'Successfully added ' + newService.name, snackType: 'info' });
              setNewService({ ...serviceSchema, tiers: [] });
              setServiceTierAddonIds([]);
            });
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a service name and a tier.', snackType: 'info' });
          }
        }}>
          <Box mx={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="button">Create</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Tier" />
        <CardContent style={{ minHeight: '40vh' }}>
          <Box m={4}>
            <TextField fullWidth label="Name" value={newServiceTier.name} onChange={e => setNewServiceTier({ ...newServiceTier, name: e.target.value })} helperText="Ex: Standard, Basic, Advanced" />
          </Box>

          <Box m={4} sx={{ display: 'flex', alignItems: 'baseline' }}>
            <SelectLookup lookupName="Addons" lookups={serviceAddons} lookupChange={val => setServiceTierAddonIds(val as string[])} lookupValue={serviceTierAddonIds} multiple createActionType={POST_SERVICE_ADDON} deleteActionType={DELETE_SERVICE_ADDON} {...props} />
          </Box>

          <Box m={4} mb={-2}>
            <Typography variant="h6">Multiplier</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
              <span>{newServiceTier.multiplier}x <span>&nbsp;</span> &nbsp;</span>
              <Slider value={parseFloat(newServiceTier.multiplier)} onChange={(e, val) => setNewServiceTier({ ...newServiceTier, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
            </Box>
          </Box>
        </CardContent>
        <CardActionArea onClick={() => {
          if (newServiceTier.name) {
            newServiceTier.addons = serviceTierAddonIds?.map(name => ({ name }));
            newService.tiers.push(newServiceTier);
            setNewServiceTier({ ...serviceTierSchema });
            setServiceTierAddonIds([]);
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a tier name.', snackType: 'info' });
          }
        }}>
          <Box mx={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="button">Add to Service</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  </Grid>
}

export default ServiceHome;