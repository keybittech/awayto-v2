import React, { useEffect, useMemo, useState } from 'react';

import FormHelperText from '@mui/material/FormHelperText';
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

import { IService, IServiceTier, IPrompts, IAssist } from 'awayto/core';
import { useComponents, useStyles, sh, useUtil } from 'awayto/hooks';

const serviceSchema = {
  name: '',
  cost: '',
  formId: ''
};

const serviceTierSchema = {
  name: '',
  multiplier: '1.00',
  formId: ''
};

const validCost = function (cost: string): boolean {
  return /(^$|^\$?\d+(,\d{3})*(\.\d*)?$)/.test(cost);
}

// In theory there's no difference between theory and practice, but in practice there is.

export function ServiceHome(props: IProps): JSX.Element {
  const classes = useStyles();

  const { setSnack } = useUtil();

  const { SelectLookup } = useComponents();

  const [postServiceAddon] = sh.usePostServiceAddonMutation();
  const [postGroupServiceAddon] = sh.usePostGroupServiceAddonMutation();
  const [deleteGroupServiceAddon] = sh.useDeleteGroupServiceAddonMutation();
  const [postService] = sh.usePostServiceMutation();
  const [postGroupService] = sh.usePostGroupServiceMutation();
  const [getGroupFormById] = sh.useLazyGetGroupFormByIdQuery();
  const [getGroupServices] = sh.useLazyGetGroupServicesQuery();
  const [getPrompt] = sh.useLazyGetPromptQuery();

  const { data : profile } = sh.useGetUserProfileDetailsQuery();
  if (!profile.groups) return <></>;

  const [group, setGroup] = useState(Object.values(profile.groups)[0]);

  const { data: groupServiceAddons, refetch: getGroupServiceAddons } = sh.useGetGroupServiceAddonsQuery({ groupName: group.name });
  const { data: groupForms } = sh.useGetGroupFormsQuery({ groupName: group.name });

  const [newService, setNewService] = useState({ ...serviceSchema, tiers: {} } as IService);
  const [newServiceTier, setNewServiceTier] = useState({ ...serviceTierSchema, addons: {} } as IServiceTier);
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);

  const [serviceSuggestions, setServiceSuggestions] = useState('');
  const [tierSuggestions, setTierSuggestions] = useState('');
  const [featureSuggestions, setFeatureSuggestions] = useState('');

  const groupsValues = useMemo(() => Object.values(profile.groups || {}), [profile]);
  
  useEffect(() => {
    async function go() {
      if (groupsValues.length) {
        const gr = groupsValues[0];
        const { promptResult } = await getPrompt({ id: IPrompts.SUGGEST_SERVICE, prompt: gr.purpose } as IAssist).unwrap();
        if (promptResult.length) setServiceSuggestions(promptResult.join(', '));
        setGroup(gr);
      }
    }
    void go();
  }, [groupsValues]);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title="Create Service"
          subheader="Services are the functions of your organization. Each service has a set of tiers and features. As well, a cost may be associated with the service. If there is a cost, tiers can be used to provide a higher level of service at a higher cost, using the multiplier. Features can be added to each tier as necessary."
          action={
            <TextField
              select
              value={group.id}
              label="Group"
              onChange={e => setGroup(groupsValues.filter(g => g.id === e.target.value)[0])}
            >
              {groupsValues.map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name.replaceAll('_', ' ')}</MenuItem>)}
            </TextField>
          }
        />
        <CardContent>

          <Grid container>
            <Grid item xs={12} md={6}>
              <Box mb={4}>
                <TextField
                  fullWidth
                  label="Name"
                  value={newService.name}
                  onChange={e => setNewService({ ...newService, name: e.target.value })}
                  onBlur={() => {
                    // When this service name changes, let's get a new prompt for tier name suggestions
                    getPrompt({ id: IPrompts.SUGGEST_TIER, prompt: `${newService.name.toLowerCase()} at ${group.name.replaceAll('_', ' ')}`} as IAssist).unwrap().then(({ promptResult }) => {
                      if (promptResult.length) setTierSuggestions(promptResult.join(', '));
                    }).catch(console.error);
                  }}
                  helperText={`${serviceSuggestions ? `AI: ${serviceSuggestions}` : 'Ex: Website Hosting, Yard Maintenance, Automotive Repair'}`}
                />
              </Box>

              <Box mb={4}>
                <TextField fullWidth label="Cost" helperText="Optional." value={newService.cost || ''} onChange={e => validCost(e.target.value) && setNewService({ ...newService, cost: /\.\d\d/.test(e.target.value) ? parseFloat(e.target.value).toFixed(2) : e.target.value })} />
              </Box>

              <Box>
                <TextField
                  select
                  fullWidth
                  value={newService.formId}
                  label="Form"
                  helperText="Optional."
                  onChange={async e => {
                    const form = await getGroupFormById({ groupName: group.name, formId: e.target.value }).unwrap();
                    if (form) {
                      setNewService({ ...newService, formId: form.id })
                    }
                  }}
                >
                  {groupForms.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
                </TextField>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Add Tier" subheader='Some services divide their offering up into tiers. For example, a "Basic" tier may have some basic features, and the "Advanced" tier has more features. You should have at least 1 tier which describes the features offered by your service. During booking, your users will see this information.' />

        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              <Box mb={4}>
                {/* <Typography variant="body2">Some services divide their offering up into tiers. For example, a "Basic" tier may some basic features, and the "Advanced" tier has more features. If your service has no tier, you can ignore this section and we'll create a standard tier for you.</Typography> */}
                <TextField
                  fullWidth
                  label="Name"
                  value={newServiceTier.name}
                  onBlur={() => {
                    // When this tier name changes, let's get a new prompt for feature name suggestions
                    getPrompt({ id: IPrompts.SUGGEST_FEATURE, prompt: `${newServiceTier.name} ${newService.name}`} as IAssist).unwrap().then(({ promptResult }) => {
                      if (promptResult.length) setFeatureSuggestions(promptResult.join(', '));
                    }).catch(console.error);
                  }}
                  onChange={e => setNewServiceTier({ ...newServiceTier, name: e.target.value })}
                  helperText={`${tierSuggestions.length ? `AI: ${tierSuggestions}` : 'Ex: Basic, Mid-Tier, Advanced'}`}
                />
              </Box>

              {group.name && <Box mb={4} flexDirection="column" sx={{ display: 'flex', alignItems: 'baseline' }}>
                <SelectLookup
                  multiple
                  lookupName='Feature'
                  lookups={groupServiceAddons}
                  lookupValue={serviceTierAddonIds}
                  parentUuid={group.name}
                  parentUuidName='groupName'
                  lookupChange={(val: string[]) => {
                    const gsa = groupServiceAddons.filter(s => val.includes(s.id)).map(s => s.id);
                    setServiceTierAddonIds(gsa);
                  }}
                  createAction={postServiceAddon}
                  deleteAction={deleteGroupServiceAddon}
                  deleteActionIdentifier='serviceAddonId'
                  refetchAction={getGroupServiceAddons}
                  attachAction={postGroupServiceAddon}
                  attachName='serviceAddonId'
                  {...props}
                />
                <Box pl={2}>
                  <FormHelperText>{featureSuggestions.length ? `AI: ${featureSuggestions}` : 'Ex: 24-Hour Support, Premium Access, Domain Registration, 20GB Storage'}</FormHelperText>
                </Box>
              </Box>}

              <Box mb={4}>
                <TextField
                  select
                  fullWidth
                  value={newServiceTier.formId}
                  label="Form"
                  helperText="Optional."
                  onChange={async e => {
                    const form = await getGroupFormById({ groupName: group.name, formId: e.target.value }).unwrap();
                    if (form) {
                      setNewServiceTier({ ...newServiceTier, formId: form.id })
                    }
                  }}
                >
                  {groupForms.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
                </TextField>
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
            const created = (new Date()).getTime().toString();
            newServiceTier.id = created;
            newServiceTier.createdOn = created;
            newServiceTier.order = Object.keys(newService.tiers).length + 1;
            newServiceTier.addons = serviceTierAddonIds.reduce((m, id, i) => {
              const addon = groupServiceAddons.find(gs => gs.id === id) || { name: '' };
              return {
                ...m,
                [id]: addon && {
                  id,
                  name: addon.name,
                  order: i + 1
                }
              }
            }, {});
            newService.tiers[newServiceTier.id] = newServiceTier;
            setNewServiceTier({ ...serviceTierSchema, addons: {} } as IServiceTier);
            setServiceTierAddonIds([]);
          } else {
            void setSnack({ snackOn: 'Provide a tier name and at least 1 feature.', snackType: 'info' });
          }
        }}>
          <Box m={2} sx={{ display: 'flex', alignItems: 'center' }}>
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
            {Object.keys(newService.tiers).length > 0 && <Box mt={4} sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {Object.values(newService.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()).map((tier, i) => {
                const addons = Object.values(tier.addons);
                return <Box key={`service-tier-chip${i + 1}new`} m={1}><Chip classes={{ root: classes.chipRoot, label: classes.chipLabel }} label={<Typography>{`#${i + 1} ` + tier.name + ' (' + tier.multiplier + 'x): ' + (addons.length ? addons.map(a => a.name).join(', ') : 'No features.')}</Typography>} onDelete={() => {
                  delete newService.tiers[tier.id];
                  setNewService({ ...newService, tiers: { ...newService.tiers } });
                }} /></Box>
              })}
            </Box>}
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card>
        <CardActionArea onClick={async () => {
          if (newService.name && group.name && Object.keys(newService.tiers)?.length) {
            const postedService = await postService({ ...newService }).unwrap();
            await postGroupService({ serviceId: postedService.id, groupName: group.name }).unwrap();
            await getGroupServices({ groupName: group.name }).unwrap();
            setSnack({ snackOn: `Successfully added ${newService.name} to ${group.name.replaceAll('_', ' ')}`, snackType: 'info' });
            setNewService({ ...serviceSchema, tiers: {} } as IService);
            setServiceTierAddonIds([]);
          } else {
            void setSnack({ snackOn: 'Provide the service name, cost and at least 1 tier.', snackType: 'info' });
          }
        }}>
          <Box m={2} sx={{ display: 'flex' }}>
            <Typography color="secondary" variant="button">Create Service</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  </Grid>
}

export const roles = [];

export default ServiceHome;