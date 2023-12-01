import React, { Suspense, useMemo, useEffect, useState, useCallback } from 'react';

import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
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
  tiers: {}
} as IService;

const serviceTierSchema = {
  name: '',
  multiplier: '1.00',
  formId: '',
  surveyId: '',
  addons: {}
} as IServiceTier;

const validCost = function(cost: string): boolean {
  return /(^$|^\$?\d+(,\d{3})*(\.\d*)?$)/.test(cost);
}

declare global {
  interface IProps {
    showCancel?: boolean;
    editGroup?: IGroup;
    editService?: IService;
  }
}

export function NewManageServiceModal({ editGroup, editService, showCancel = true, closeModal, ...props }: IProps) {

  const classes = useStyles();
  const { SelectLookup, ServiceTierAddons, ManageFormModal } = useComponents();

  const { setSnack } = useUtil();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();
  const group = useMemo(() => editGroup || Object.values(profile?.groups || {}).find(g => g.active), [profile, editGroup]);

  const { data: existingService } = sh.useGetServiceByIdQuery({ id: editService?.id || '' }, { skip: !editService });
  const { data: groupServiceAddons, refetch: getGroupServiceAddons } = sh.useGetGroupServiceAddonsQuery(undefined, { skip: !group?.id });
  const { data: groupForms, refetch: getGroupForms, isSuccess: groupFormsLoaded } = sh.useGetGroupFormsQuery(undefined, { skip: !group?.id });

  const [newService, setNewService] = useState({ ...serviceSchema, ...editService });
  const [newServiceTier, setNewServiceTier] = useState({ ...serviceTierSchema });
  const [serviceTierAddonIds, setServiceTierAddonIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState('');

  const {
    comp: ServiceSuggestions,
    suggest: suggestServices,
    suggestions: serviceSuggestions
  } = useSuggestions('services');

  const {
    comp: TierSuggestions,
    suggest: suggestTiers,
    suggestions: tierSuggestions
  } = useSuggestions('service_tiers');

  const {
    comp: AddonSuggestions,
    suggest: suggestAddon,
    suggestions: addonSuggestions
  } = useSuggestions('service_tier_addons');

  const [postServiceAddon] = sh.usePostServiceAddonMutation();
  const [postGroupServiceAddon] = sh.usePostGroupServiceAddonMutation();
  const [deleteGroupServiceAddon] = sh.useDeleteGroupServiceAddonMutation();
  const [putService] = sh.usePutServiceMutation();
  const [postService] = sh.usePostServiceMutation();
  const [postGroupService] = sh.usePostGroupServiceMutation();

  const handleSubmit = useCallback(() => {
    if (!newService.name || !Object.keys(newService.tiers).length) {
      setSnack({ snackOn: 'Provide the service name and at least 1 tier with at least 1 feature.', snackType: 'info' });
      return;
    }

    if (!editGroup) {
      (newService.id ? putService : postService)(newService).unwrap().then(async ({ id: serviceId }) => {
        !newService.id && await postGroupService({ serviceId }).unwrap();
        closeModal && closeModal({ ...newService, id: serviceId });
      }).catch(console.error);
    } else {
      closeModal && closeModal(newService);
    }
  }, [newService]);

  useEffect(() => {
    if (group?.purpose) {
      void suggestServices({ id: IPrompts.SUGGEST_SERVICE, prompt: group.purpose });
    }
  }, [group?.purpose]);

  useEffect(() => {
    if (existingService) {
      setNewService({ ...newService, ...existingService });
    }
  }, [existingService]);

  return <>
    <Dialog open={dialog === 'manage_form'} fullWidth maxWidth="lg">
      <Suspense>
        <ManageFormModal {...props} closeModal={() => {
          setDialog('')
          void getGroupForms();
        }} />
      </Suspense>
    </Dialog>

    <Card>
      <CardHeader title={`${editService ? 'Edit' : 'Create'} Service`} />
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

            {/* <Box mb={4}>
              <TextField fullWidth label="Cost" helperText="Optional." value={newService.cost || ''} onChange={e => validCost(e.target.value) && setNewService({ ...newService, cost: /\.\d\d/.test(e.target.value) ? parseFloat(e.target.value).toFixed(2) : e.target.value })} />
            </Box> */}

            {groupFormsLoaded && <Box mb={4}>
              <TextField
                select
                fullWidth
                value={newService.formId || 'unset'}
                label="Intake Form"
                helperText="Optional. Shown during appointment creation."
                onChange={e => {
                  e.target.value && setNewService({ ...newService, formId: e.target.value === 'unset' ? '' : e.target.value });
                }}
              >
                <MenuItem key="create-form" onClick={() => setDialog('manage_form')}>Add a form to this list</MenuItem>
                <MenuItem key="unset-selection" value="unset">&nbsp;</MenuItem>
                {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
              </TextField>
            </Box>}

            {groupFormsLoaded && <Box>
              <TextField
                select
                fullWidth
                value={newService.surveyId || 'unset'}
                label="Survey Form"
                helperText="Optional. Shown during post-appointment summary."
                onChange={e => {
                  e.target.value && setNewService({ ...newService, surveyId: e.target.value === 'unset' ? '' : e.target.value });
                }}
              >
                <MenuItem key="create-form" onClick={() => setDialog('manage_form')}>Add a form to this list</MenuItem>
                <MenuItem key="unset-selection" value="unset">&nbsp;</MenuItem>
                {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
              </TextField>
            </Box>}
          </Grid>
        </Grid>
      </CardContent>

      <CardHeader title="Add Tiers" />

      <CardContent sx={{ padding: '0 15px' }}>
        <Grid container>
          <Grid item xs={12}>
            <Box mb={4}>
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
                  e.target.value && setNewServiceTier({ ...newServiceTier, formId: e.target.value === 'unset' ? '' : e.target.value });
                }}
              >
                <MenuItem key="create-form" onClick={() => setDialog('manage_form')}>Add a form to this list</MenuItem>
                <MenuItem key="unset-selection" value="unset">&nbsp;</MenuItem>
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
                  e.target.value && setNewServiceTier({ ...newServiceTier, surveyId: e.target.value === 'unset' ? '' : e.target.value });
                }}
              >
                <MenuItem key="create-form" onClick={() => setDialog('manage_form')}>Add a form to this list</MenuItem>
                <MenuItem key="unset-selection" value="unset">&nbsp;</MenuItem>
                {groupForms?.map(form => <MenuItem key={`form-version-select${form.id}`} value={form.id}>{form.name}</MenuItem>)}
              </TextField>
            </Box>}

            {/* <Box>
              <Typography variant="h6">Multiplier</Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <span>{newServiceTier.multiplier}x <span>&nbsp;</span> &nbsp;</span>
                <Slider value={parseFloat(newServiceTier.multiplier)} onChange={(e, val) => setNewServiceTier({ ...newServiceTier, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
              </Box>
            </Box> */}
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
          setNewServiceTier({ ...serviceTierSchema });
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
      {Object.keys(newService.tiers).length > 0 ? <>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {Object.values(newService.tiers).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()).map((tier, i) => {
              return <Box key={`service-tier-chip${i + 1}new`} m={1}>
                <Chip
                  sx={classes.chipRoot}
                  label={
                    <Typography sx={classes.chipLabel}>
                      {`#${i + 1} ` + tier.name + ' (' + tier.multiplier + 'x)'}
                    </Typography>
                  }
                  onDelete={() => {
                    const tiers = { ...newService.tiers };
                    delete tiers[tier.id];
                    setNewService({ ...newService, tiers });
                  }}
                />
              </Box>
            })}
          </Box>
        </CardContent>
        <CardHeader title="Tiers" subheader='The following table will be shown during booking.' />
        <CardContent sx={{ padding: '0 15px' }}>
          <Suspense>
            <ServiceTierAddons service={newService} />
          </Suspense>
        </CardContent>
      </> : <CardContent>No tiers added yet.</CardContent>}

      <CardActions>

        <Grid container justifyContent={showCancel ? "space-between" : "flex-end"}>
          {showCancel && <Button onClick={closeModal}>Cancel</Button>}
          <Button disabled={!newService.name || !Object.keys(newService.tiers).length} onClick={handleSubmit}>Save Service</Button>
        </Grid>
      </CardActions>
    </Card>
  </>;
}

export default NewManageServiceModal;
