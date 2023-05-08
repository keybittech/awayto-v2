import React, { useContext } from 'react';
import { useNavigate } from 'react-router';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { useComponents, useContexts, sh, useUtil, useGroupForm, useAccordion, useFiles } from 'awayto/hooks';
import { IFormVersionSubmission, IQuote } from 'awayto/core';

export function RequestQuote(props: IProps): JSX.Element {

  const navigate = useNavigate();
  const { setSnack } = useUtil();
  const { ScheduleDatePicker, ScheduleTimePicker } = useComponents();
  const [postQuote] = sh.usePostQuoteMutation();

  const { 
    GroupContext,
    GroupScheduleContext,
    GroupScheduleSelectionContext
  } = useContexts();

  const {
    GroupSelect
  } = useContext(GroupContext) as GroupContextType;

  const {
    groupSchedule,
    groupScheduleService,
    groupScheduleServiceTier,
    GroupScheduleSelect,
    GroupScheduleServiceSelect,
    GroupScheduleServiceTierSelect
  } = useContext(GroupScheduleContext) as GroupScheduleContextType;

  const { quote } = useContext(GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;

  const { form: serviceForm, comp: ServiceForm, valid: serviceFormValid } = useGroupForm(groupScheduleService?.formId);
  const { form: tierForm, comp: TierForm, valid: tierFormValid } = useGroupForm(groupScheduleServiceTier?.formId);

  const SelectTimeAccordion = useAccordion('Select Time');
  const GroupScheduleServiceAccordion = useAccordion((groupScheduleService?.name || '') + ' Questionnaire');
  const GroupScheduleServiceTierAccordion = useAccordion((groupScheduleServiceTier?.name || '') + ' Questionnaire');

  const { files, comp: FileManager } = useFiles();

  if (!groupSchedule || !groupScheduleService) return <Alert severity="info">
    There are no active schedules or operations are currently halted.
  </Alert>;

  return <>
    <Grid container spacing={2}>

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Create Request"
            subheader="Request services from a group. Some fields may be required depending on the service."
            action={<GroupSelect />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <GroupScheduleSelect />
              </Grid>
              <Grid item xs={4}>
                <GroupScheduleServiceSelect />
              </Grid>
              <Grid item xs={4}>
                <GroupScheduleServiceTierSelect />
              </Grid>
            </Grid>

          </CardContent>
        </Card>

        {serviceForm && <GroupScheduleServiceAccordion>
          <ServiceForm />
        </GroupScheduleServiceAccordion>}

        {tierForm && <GroupScheduleServiceTierAccordion>
          <TierForm />
        </GroupScheduleServiceTierAccordion>}

        <SelectTimeAccordion>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <ScheduleDatePicker key={groupSchedule.id} />
            </Grid>
            <Grid item xs={4}>
              <ScheduleTimePicker key={groupSchedule.id} />
            </Grid>
          </Grid>
        </SelectTimeAccordion>

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            if (!serviceFormValid || !tierFormValid || !groupScheduleServiceTier) {
              setSnack({ snackType: 'error', snackOn: 'Please ensure all required fields are filled out.' });
              return;
            }

            postQuote({
              slotDate: quote.slotDate,
              scheduleBracketSlotId: quote.scheduleBracketSlotId,
              serviceTierId: groupScheduleServiceTier.id,
              serviceForm: (serviceForm ? {
                formVersionId: serviceForm.version.id,
                submission: serviceForm.version.submission
              } : {}) as IFormVersionSubmission,
              tierForm: (tierForm ? {
                formVersionId: tierForm.version.id,
                submission: tierForm.version.submission
              } : {}) as IFormVersionSubmission
            }).unwrap().then(() => {
              setSnack({ snackOn: 'Your request has been made successfully!' });
              navigate('/');
            }).catch(console.error);
          }}>
            <Box m={2} sx={{ display: 'flex' }}>
              <Typography color="secondary" variant="button">Submit Request</Typography>
            </Box>
          </CardActionArea>
        </Card>
      </Grid>

    </Grid>
  </>

}

export default RequestQuote;