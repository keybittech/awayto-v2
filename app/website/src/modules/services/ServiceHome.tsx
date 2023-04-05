import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

import { IAssistActionTypes, IService, IServiceActionTypes, IServiceTier, IGroupFormActionTypes, IGroupServiceAddonActionTypes, IServiceAddonActionTypes, IGroupServiceActionTypes, IUtilActionTypes, IGroup, IForm, IPrompts, IAssist } from 'awayto/core';
import { storeApi, useApi, useRedux, useComponents, useAct, useStyles } from 'awayto/hooks';

const { POST_SERVICE } = IServiceActionTypes;
const { POST_SERVICE_ADDON } = IServiceAddonActionTypes;
const { GET_GROUP_FORMS, GET_GROUP_FORM_BY_ID } = IGroupFormActionTypes;
const { GET_GROUP_SERVICES, POST_GROUP_SERVICE } = IGroupServiceActionTypes;
const { GET_GROUP_SERVICE_ADDONS, POST_GROUP_SERVICE_ADDON, DELETE_GROUP_SERVICE_ADDON } = IGroupServiceAddonActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { GET_PROMPT } = IAssistActionTypes;

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
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  if (!profile) return <></>;

  const [newService, setNewService] = useState({ ...serviceSchema, tiers: {} } as IService);
  const [newServiceTier, setNewServiceTier] = useState({ ...serviceTierSchema, addons: {} } as IServiceTier);
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);
  const { groupServiceAddons } = useRedux(state => state);
  const { groupForms } = useRedux(state => state.groupForm);

  const [group, setGroup] = useState({ id: '' } as IGroup);
  const [serviceSuggestions, setServiceSuggestions] = useState('');
  const [tierSuggestions, setTierSuggestions] = useState('');
  const [featureSuggestions, setFeatureSuggestions] = useState('');

  const groupsValues = useMemo(() => Object.values(profile.groups || {}), [profile]);
  const groupServiceAddonValues = useMemo(() => Object.values(groupServiceAddons || {}), [groupServiceAddons]);
  const groupFormsValues = useMemo(() => Object.values(groupForms || {}), [groupForms]);
  
  useEffect(() => {
    if (groupsValues.length) {
      const gr = groupsValues[0];
      const [, res] = api(GET_PROMPT, { id: IPrompts.SUGGEST_SERVICE, prompt: gr.purpose }, { useParams: true })
      res?.then(serviceSuggestionData => {
        const { promptResult } = serviceSuggestionData as IAssist;
        if (promptResult) setServiceSuggestions(promptResult.join(', '))
        setGroup(gr);
      })
    }
  }, [groupsValues]);

  useEffect(() => {
    if (!group.name) return;
    const [abort1] = api(GET_GROUP_SERVICES, { groupName: group.name });
    const [abort2] = api(GET_GROUP_FORMS, { groupName: group.name });
    const [abort3, rez] = api(GET_GROUP_SERVICE_ADDONS, { groupName: group.name });
    rez?.then(() => setServiceTierAddonIds([]));
    return () => {
      abort1();
      abort2();
      abort3();
    }
  }, [group]);

  const getGroupFormById = useCallback(async (formId: string): Promise<IForm | undefined> => {
    const [, res] = api(GET_GROUP_FORM_BY_ID, { groupName: group.name, formId });
    return await res?.then(forms => {
      const [form] = forms as IForm[];
      return form;
    });
  }, [group])

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
                    const [, res] = api(GET_PROMPT, { id: IPrompts.SUGGEST_TIER, prompt: `${newService.name.toLowerCase()} at ${group.name.replaceAll('_', ' ')}`}, { useParams: true })
                    res?.then(tierSuggestionData => {
                      const { promptResult } = tierSuggestionData as IAssist;
                      if (promptResult) setTierSuggestions(promptResult.join(', '))
                    })
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
                    const form = await getGroupFormById(e.target.value);
                    if (form) {
                      setNewService({ ...newService, formId: form.id })
                    }
                  }}
                >
                  {groupFormsValues.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
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
                    const [, res] = api(GET_PROMPT, { id: IPrompts.SUGGEST_FEATURE, prompt: `${newServiceTier.name} ${newService.name}`}, { useParams: true })
                    res?.then(featureSuggestionData => {
                      const { promptResult } = featureSuggestionData as IAssist;
                      if (promptResult) setFeatureSuggestions(promptResult.join(', '))
                    });
                  }}
                  onChange={e => setNewServiceTier({ ...newServiceTier, name: e.target.value })}
                  helperText={`${tierSuggestions.length ? `AI: ${tierSuggestions}` : 'Ex: Basic, Mid-Tier, Advanced'}`}
                />
              </Box>

              {group.name && <Box mb={4} flexDirection="column" sx={{ display: 'flex', alignItems: 'baseline' }}>
                <SelectLookup
                  multiple
                  lookupName='Feature'
                  lookups={groupServiceAddonValues}
                  lookupValue={serviceTierAddonIds}
                  parentUuid={group.name}
                  parentUuidName='groupName'
                  lookupChange={(val: string[]) => {
                    const gsa = groupServiceAddonValues.filter(s => val.includes(s.id)).map(s => s.id);
                    setServiceTierAddonIds(gsa);
                  }}
                  createAction={POST_SERVICE_ADDON}
                  deleteAction={DELETE_GROUP_SERVICE_ADDON}
                  refetchAction={GET_GROUP_SERVICE_ADDONS}
                  attachAction={POST_GROUP_SERVICE_ADDON}
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
                    const form = await getGroupFormById(e.target.value);
                    if (form) {
                      setNewServiceTier({ ...newServiceTier, formId: form.id })
                    }
                  }}
                >
                  {groupFormsValues.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
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
              const addon = groupServiceAddons[id];
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
            void act(SET_SNACK, { snackOn: 'Provide a tier name and at least 1 feature.', snackType: 'info' });
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
        <CardActionArea onClick={() => {
          if (newService.name && group.name && Object.keys(newService.tiers)?.length) {
            const [, res] = api(POST_SERVICE, { ...newService }, { load: true });

            res?.then(services => {
              const [service] = services as IService[];
              const [, rez] = api(POST_GROUP_SERVICE, { serviceId: service.id, groupName: group.name }, { load: true });
              rez?.then(() => {
                api(GET_GROUP_SERVICES, { groupName: group.name });
                act(SET_SNACK, { snackOn: `Successfully added ${service.name} to ${group.name.replaceAll('_', ' ')}`, snackType: 'info' });
                setNewService({ ...serviceSchema, tiers: {} } as IService);
                setServiceTierAddonIds([]);
              });
            }).catch(console.warn);
          } else {
            void act(SET_SNACK, { snackOn: 'Provide the service name, cost and at least 1 tier.', snackType: 'info' });
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