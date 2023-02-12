import React, { useEffect, useState } from 'react';

import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';

import { IService, IServiceActionTypes, IServiceTier, IGroupServiceAddonActionTypes, IServiceAddonActionTypes, IGroupServiceActionTypes, IUtilActionTypes, IFormActionTypes, IServiceState, IGroup } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';

import { useStyles } from '../../../style';

const { DELETE_SERVICE, POST_SERVICE } = IServiceActionTypes;
const { POST_SERVICE_ADDON } = IServiceAddonActionTypes;
const { GET_GROUP_SERVICES, POST_GROUP_SERVICE } = IGroupServiceActionTypes;
const { GET_GROUP_SERVICE_ADDONS, POST_GROUP_SERVICE_ADDON, DELETE_GROUP_SERVICE_ADDON } = IGroupServiceAddonActionTypes;
const { SET_SNACK } = IUtilActionTypes;

const serviceSchema = {
  name: '',
  cost: '',
  groupId: ''
};

const serviceTierSchema = {
  name: '',
  multiplier: '1.00'
};

const validCost = function (cost: string): boolean {
  return /(^$|^\$?\d+(,\d{3})*(\.\d*)?$)/.test(cost);
}

// In theory there's no difference between theory and practice, but in practice there is.

export function ServiceHome(props: IProps): JSX.Element {
  const classes = useStyles();
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const [newService, setNewService] = useState<IService>({ ...serviceSchema, tiers: [] });
  const [newServiceTier, setNewServiceTier] = useState<IServiceTier>({ ...serviceTierSchema, addons: [] });
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupServiceAddons } = useRedux(state => state.groupServiceAddon);
  const { groups } = useRedux(state => state.profile);
  const [group, setGroup] = useState(groups.at(0) as unknown as IGroup);

  useEffect(() => {
    if (!group.name) return;
    const [abort1] = api(GET_GROUP_SERVICES, true, { groupName: group.name });
    const [abort2, rez] = api(GET_GROUP_SERVICE_ADDONS, false, { groupName: group.name });
    rez?.then(() => setServiceTierAddonIds([]));
    return () => {
      abort1();
      abort2();
    }
  }, [group]);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card>
        <CardHeader title="Service" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Typography variant="body2">A service is the base level object that will be offered for sale to your users. Services can have tiers and features, which can increase the cost of the base service via a multiplier on the tier. Or create a base tier and add all</Typography>
                <Typography variant="h6">Current Services: </Typography>
                {Object.values(groupServices).map((service, i) => {
                  return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name}`} onDelete={() => {
                    void api(DELETE_SERVICE, true, { id: service.id });
                  }} /></Box>
                })}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    {group?.id && <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Group" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              
              <TextField
                select
                fullWidth
                label="Groups"
                helperText="Select the group for this service."
                value={group.id}
                onChange={e => setGroup(Object.values(groups).filter(g => g.id === e.target.value)[0])}
              >
                {Object.values(groups).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
              </TextField>

            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>}

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
                <TextField fullWidth label="Cost" value={newService.cost || ''} onChange={e => validCost(e.target.value) && setNewService({ ...newService, cost: /\.\d\d/.test(e.target.value) ? parseFloat(e.target.value).toFixed(2) : e.target.value })} />
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
                <Typography variant="body2">Some services divide their offering up into tiers. For example, a "Basic" tier may have some basic features, and the "Advanced" tier has more features. You should have at least 1 tier which describes the features offered by your service. During booking, your users will see this information.</Typography>
              </Box>

              <Box mb={4}>
                {/* <Typography variant="body2">Some services divide their offering up into tiers. For example, a "Basic" tier may some basic features, and the "Advanced" tier has more features. If your service has no tier, you can ignore this section and we'll create a standard tier for you.</Typography> */}
                <TextField fullWidth label="Name" value={newServiceTier.name} onChange={e => setNewServiceTier({ ...newServiceTier, name: e.target.value })} helperText="Ex: Standard, Basic, Advanced" />
              </Box>

              <Box mb={4} sx={{ display: 'flex', alignItems: 'baseline' }}>
                <SelectLookup
                  multiple
                  lookupName='Feature'
                  lookups={Object.values(groupServiceAddons)}
                  lookupValue={serviceTierAddonIds}
                  parentUuid={group?.name}
                  parentUuidName='groupName'
                  lookupChange={(val: string[]) => {
                    const gsa = Object.values(groupServiceAddons).filter(s => val.includes(s.id as string)).map(s => s.id as string);
                    setServiceTierAddonIds(gsa);
                  }}
                  createAction={POST_SERVICE_ADDON}
                  deleteAction={DELETE_GROUP_SERVICE_ADDON}
                  refetchAction={GET_GROUP_SERVICE_ADDONS}
                  attachAction={POST_GROUP_SERVICE_ADDON}
                  attachName='serviceAddonId'
                  {...props}
                />
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
          if (newServiceTier.name && serviceTierAddonIds.length) {
            newServiceTier.addons = serviceTierAddonIds?.map(id => ({ id, name: Object.values(groupServiceAddons).find(sa => sa.id === id)?.name as string }));
            newService.tiers?.push(newServiceTier);
            setNewServiceTier({ ...serviceTierSchema, addons: [] });
            setServiceTierAddonIds([]);
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a tier name and at least 1 feature.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="secondary" variant="button">Add Tier to Service</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card>
        <CardContent sx={{ padding: '0 15px' }}>
          <Box>
            <Typography variant="h6">Tiers</Typography>
            <Typography variant="body2">The order that tiers appear here is the order they will be listed during booking.</Typography>
            {newService.tiers?.length > 0 && <Box mt={4} sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {newService.tiers?.map((tier, i) => {
                return <Box key={`service-tier-chip${i + 1}new`} m={1}><Chip classes={{ root: classes.chipRoot, label: classes.chipLabel }} label={<Typography>{`#${i + 1} ` + tier.name + ' (' + tier.multiplier + 'x): ' + (tier.addons.length ? tier.addons.map(a => a.name).join(', ') : 'No features.')}</Typography>} onDelete={() => {
                  setNewService({ ...newService, tiers: newService.tiers?.filter(t => t.name !== tier.name) });
                }} /></Box>
              })}
            </Box>}
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card>
        <CardActionArea onClick={() => {
          if (newService.name && newService.tiers?.length) {
            const [, res] = api(POST_SERVICE, true, { ...newService });

            res?.then(services => {
              if (services && group) {
                const [service] = services as IService[];

                const [, rez] = api(POST_GROUP_SERVICE, true, { serviceId: service.id, groupName: group.name });

                rez?.then(() => {
                  act(SET_SNACK, { snackOn: `Successfully added ${service.name} to ${group.name}`, snackType: 'info' });
                  setNewService({ ...serviceSchema, tiers: [] });
                  setServiceTierAddonIds([]);
                });
              }
            });
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a group, service name, cost and at least 1 tier.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="secondary" variant="button">Create Service</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  </Grid>
}

export default ServiceHome;