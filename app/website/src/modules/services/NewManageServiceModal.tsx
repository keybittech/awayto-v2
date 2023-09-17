import React, { useMemo, useEffect, useState, useCallback } from 'react';

import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { IGroup, IService, IServiceTier } from 'awayto/core';
import { useComponents, useStyles, sh, useUtil, useSuggestions } from 'awayto/hooks';

const serviceSchema = {
  name: '',
  cost: '',
  formId: '',
  surveyId: '',
};

const serviceTierSchema = {
  name: '',
  multiplier: '1.00',
  formId: '',
  surveyId: '',
};

const validCost = function (cost: string): boolean {
  return /(^$|^\$?\d+(,\d{3})*(\.\d*)?$)/.test(cost);
}

declare global {
  interface IProps {
    editGroup?: IGroup;
    editService?: IService;
  }
}

export function NewManageServiceModal({ editGroup, editService, closeModal, ...props }: IProps) {

  const classes = useStyles();
  const { SelectLookup, ServiceTierAddons } = useComponents();

  const { setSnack } = useUtil();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();
  const group = useMemo(() => editGroup || Object.values(profile?.groups || {}).find(g => g.active), [profile, editGroup]);

  const { data: groupServiceAddons, refetch: getGroupServiceAddons } = sh.useGetGroupServiceAddonsQuery(undefined, { skip: !group?.id });
  const { data: groupForms, isSuccess: groupFormsLoaded } = sh.useGetGroupFormsQuery(undefined, { skip: !group?.id });

  const [newService, setNewService] = useState({ ...(editService || { name: '', tiers: {} }) } as IService);
  const [newServiceTier, setNewServiceTier] = useState({ ...serviceTierSchema, addons: {} } as IServiceTier);
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);

  const {
    comp: ServiceSuggestions,
    suggest: suggestServices,
    suggestions: serviceSuggestions
  } = useSuggestions();

  const {
    comp: TierSuggestions,
    suggest: suggestTiers,
    suggestions: tierSuggestions
  } = useSuggestions();

  const {
    comp: AddonSuggestions,
    suggest: suggestAddon,
    suggestions: addonSuggestions
  } = useSuggestions();

  const [postServiceAddon] = sh.usePostServiceAddonMutation();
  const [postGroupServiceAddon] = sh.usePostGroupServiceAddonMutation();
  const [deleteGroupServiceAddon] = sh.useDeleteGroupServiceAddonMutation();
  const [postService] = sh.usePostServiceMutation();
  const [postGroupService] = sh.usePostGroupServiceMutation();
  const [getGroupFormById] = sh.useLazyGetGroupFormByIdQuery();
  const [getGroupServices] = sh.useLazyGetGroupServicesQuery();

  const handleSubmit = useCallback(() => {
    if (!newService.name || !Object.keys(newService.tiers).length) {
      setSnack({ snackOn: 'Provide the service name and at least 1 tier with at least 1 feature.', snackType: 'info' });
      return;
    }

    closeModal && closeModal({
      ...newService
    });
    // async function go() {
    //   if (groupName) {
    //     const postedService = await postService({ ...newService }).unwrap();
    //     await postGroupService({ serviceId: postedService.id, groupName }).unwrap();
    //     await getGroupServices({ groupName }).unwrap();
    //     setSnack({ snackOn: `Successfully added ${newService.name} to ${groupName.replaceAll('_', ' ')}`, snackType: 'info' });
    //     setNewService({ ...serviceSchema, tiers: {} } as IService);
    //     setServiceTierAddonIds([]);
    //   }
    // }
    // void go();
  }, [newService]);

  useEffect(() => {
    if (group?.purpose) {
      void suggestServices({ id: IPrompts.SUGGEST_SERVICE, prompt: group.purpose });
    }
  }, [group?.purpose]);

  return <>
    <Grid container spacing={2} p={2}>

      <Grid item xs={12}>
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title={`${editService ? 'Edit' : 'Create'} Service`}
            subheader="Services are the functions of your organization. Each service has a set of tiers and features. As well, a cost may be associated with the service. If there is a cost, tiers can be used to provide a higher level of service at a higher cost, using the multiplier. Features can be added to each tier as necessary."
          />
          <CardContent>

            <Grid container>
              <Grid item xs={12}>
                <Box mb={4}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                    onBlur={() => {
                      if (!newService.name || !group?.displayName) return;
                      void suggestTiers({ id: IPrompts.SUGGEST_TIER, prompt: `${newService.name.toLowerCase()} at ${group?.displayName}` });
                    }}
                    helperText={!serviceSuggestions.length ?
                      'Ex: Website Hosting, Yard Maintenance, Automotive Repair' :
                      <ServiceSuggestions handleSuggestion={suggestedService => {
                        if (!group?.displayName) return;
                        void suggestTiers({ id: IPrompts.SUGGEST_TIER, prompt: `${suggestedService.toLowerCase()} at ${group?.displayName}` });
                        setNewService({ ...newService, name: suggestedService });
                      }} />
                    }
                  />
                </Box>

                <Box mb={4}>
                  <TextField fullWidth label="Cost" helperText="Optional." value={newService.cost || ''} onChange={e => validCost(e.target.value) && setNewService({ ...newService, cost: /\.\d\d/.test(e.target.value) ? parseFloat(e.target.value).toFixed(2) : e.target.value })} />
                </Box>

                {groupFormsLoaded && <Box mb={4}>
                  <TextField
                    select
                    fullWidth
                    value={newService.formId}
                    label="Intake Form"
                    helperText="Optional. Shown during appointment creation."
                    onChange={e => {
                      getGroupFormById({ formId: e.target.value }).unwrap().then(form => {
                        if (form) {
                          setNewService({ ...newService, formId: form.id });
                        }
                      }).catch(console.error);
                    }}
                  >
                    {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
                  </TextField>
                </Box>}

                {groupFormsLoaded && <Box>
                  <TextField
                    select
                    fullWidth
                    value={newService.surveyId}
                    label="Survey Form"
                    helperText="Optional. Shown during post-appointment summary."
                    onChange={e => {
                      getGroupFormById({ formId: e.target.value }).unwrap().then(form => {
                        if (form) {
                          setNewService({ ...newService, surveyId: form.id });
                        }
                      }).catch(console.error);
                    }}
                  >
                    {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
                  </TextField>
                </Box>}
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
              <Grid item xs={12}>
                <Box mb={4}>
                  {/* <Typography variant="body2">Some services divide their offering up into tiers. For example, a "Basic" tier may some basic features, and the "Advanced" tier has more features. If your service has no tier, you can ignore this section and we'll create a standard tier for you.</Typography> */}
                  <TextField
                    fullWidth
                    label="Name"
                    value={newServiceTier.name}
                    onChange={e => setNewServiceTier({ ...newServiceTier, name: e.target.value })}
                    onBlur={() => {
                      if (!newServiceTier.name || !newService.name) return;
                      void suggestAddon({ id: IPrompts.SUGGEST_FEATURE, prompt: `${newServiceTier.name} ${newService.name}` });
                    }}
                    helperText={!tierSuggestions.length ?
                      'Ex: Basic, Mid-Tier, Advanced' :
                      <TierSuggestions handleSuggestion={suggestedTier => {
                        void suggestAddon({ id: IPrompts.SUGGEST_FEATURE, prompt: `${suggestedTier} ${newService.name}` });
                        setNewServiceTier({ ...newServiceTier, name: suggestedTier })
                      }} />
                    }
                  />
                </Box>

                <Box mb={4} flexDirection="column" sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <SelectLookup
                    multiple
                    lookupName='Feature'
                    lookups={groupServiceAddons}
                    lookupValue={serviceTierAddonIds}
                    helperText={!addonSuggestions.length ?
                      'Ex: 24-Hour Support, Premium Access, Domain Registration, 20GB Storage' :
                      <AddonSuggestions handleSuggestion={suggestedAddon => {
                        if (groupServiceAddons) {
                          const existingId = groupServiceAddons.find(gsa => gsa.name === suggestedAddon)?.id;
                          if (!existingId || (existingId && !serviceTierAddonIds.includes(existingId))) {
                            if (existingId) {
                              setServiceTierAddonIds([...serviceTierAddonIds, existingId])
                            } else {
                              postServiceAddon({ name: suggestedAddon }).unwrap().then(newAddon => {
                                postGroupServiceAddon({ serviceAddonId: newAddon.id }).unwrap().then(async () => {
                                  await getGroupServiceAddons();
                                  !serviceTierAddonIds.includes(newAddon.id) && setServiceTierAddonIds([...serviceTierAddonIds, newAddon.id]);
                                }).catch(console.error);
                              }).catch(console.error);
                            }
                          }

                        }
                      }} />
                    }
                    lookupChange={(val: string[]) => {
                      const gsa = groupServiceAddons?.filter(s => val.includes(s.id)).map(s => s.id);
                      if (gsa) setServiceTierAddonIds(gsa);
                    }}
                    createAction={postServiceAddon}
                    deleteAction={editGroup ? undefined : deleteGroupServiceAddon}
                    deleteActionIdentifier='serviceAddonId'
                    deleteComplete={(val: string) => {
                      const tiers = { ...newService.tiers };
                      Object.values(tiers).forEach(tier => {
                        delete tier.addons[val];
                      })
                      setNewService({ ...newService, tiers });
                    }}
                    refetchAction={getGroupServiceAddons}
                    attachAction={postGroupServiceAddon}
                    attachName='serviceAddonId'
                    {...props}
                  />
                </Box>

                {groupFormsLoaded && <Box mb={4}>
                  <TextField
                    select
                    fullWidth
                    value={newServiceTier.formId}
                    label="Intake Form"
                    helperText="Optional. Shown during appointment creation."
                    onChange={e => {
                      getGroupFormById({ formId: e.target.value }).unwrap().then(form => {
                        if (form) {
                          setNewServiceTier({ ...newServiceTier, formId: form.id });
                        }
                      }).catch(console.error);
                    }}
                  >
                    {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
                  </TextField>
                </Box>}

                {groupFormsLoaded && <Box mb={4}>
                  <TextField
                    select
                    fullWidth
                    value={newServiceTier.surveyId}
                    label="Survey Form"
                    helperText="Optional. Shown during post-appointment summary."
                    onChange={e => {
                      getGroupFormById({ formId: e.target.value }).unwrap().then(form => {
                        if (form) {
                          setNewServiceTier({ ...newServiceTier, surveyId: form.id });
                        }
                      }).catch(console.error);
                    }}
                  >
                    {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
                  </TextField>
                </Box>}

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
            if (newServiceTier.name && serviceTierAddonIds.length && !Object.values(newService.tiers).some(ti => ti.name === newServiceTier.name)) {
              const created = (new Date()).getTime().toString();
              newServiceTier.id = created;
              newServiceTier.createdOn = created;
              newServiceTier.order = Object.keys(newService.tiers).length + 1;
              newServiceTier.addons = serviceTierAddonIds.reduce((m, id, i) => {
                const addon = groupServiceAddons?.find(gs => gs.id === id) || { name: '' };
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
              setNewService({ ...newService });
            } else {
              void setSnack({ snackOn: 'Provide a unique tier name and at least 1 feature.', snackType: 'info' });
            }
          }}>
            <Box m={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography color="secondary" variant="button">Add Tier to Service</Typography>
            </Box>
          </CardActionArea>
          {Object.keys(newService.tiers).length > 0 && <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {Object.values(newService.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()).map((tier, i) => {
                return <Box key={`service-tier-chip${i + 1}new`} m={1}><Chip classes={{ root: classes.chipRoot, label: classes.chipLabel }} label={<Typography>{`#${i + 1} ` + tier.name + ' (' + tier.multiplier + 'x)'}</Typography>} onDelete={() => {
                  const tiers = { ...newService.tiers };
                  delete tiers[tier.id];
                  setNewService({ ...newService, tiers });
                }} /></Box>
              })}
            </Box>
          </CardContent>}
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader title="Tiers" subheader='The following table will be shown during booking.' />
          <CardContent sx={{ padding: '0 15px' }}>
            <ServiceTierAddons service={newService} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    <Card>
      <CardActions>

        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Cancel</Button>
          <Button
            onClick={handleSubmit}
          >
            Create Service
          </Button>
        </Grid>
      </CardActions>
    </Card>
  </>;
}

export default NewManageServiceModal;