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

import { useComponents, useContexts, sh, useUtil, useGroupForm, useAccordion } from 'awayto/hooks';

export function RequestQuote(props: IProps): JSX.Element {

  const navigate = useNavigate();
  const { setSnack } = useUtil();
  const { FileManager } = useComponents();
  const [postQuote] = sh.usePostQuoteMutation();

  const { GroupContext, GroupScheduleContext, GroupScheduleSelectionContext } = useContexts();

  const { GroupSelect } = useContext(GroupContext) as GroupContextType;

  const {
    groupSchedule,
    groupScheduleService,
    groupScheduleServiceTier,
    GroupScheduleSelect,
    GroupScheduleServiceSelect,
    GroupScheduleServiceTierSelect
  } = useContext(GroupScheduleContext) as GroupScheduleContextType;

  const {
    quote,
    firstAvailable,
    GroupScheduleDateSelection,
    GroupScheduleTimeSelection
  } = useContext(GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;

  const {
    form: serviceForm,
    comp: ServiceForm,
    valid: serviceFormValid
  } = useGroupForm((groupScheduleService?.name || '') + ' Questionnaire', groupScheduleService?.formId);

  const {
    form: tierForm,
    comp: TierForm,
    valid: tierFormValid
  } = useGroupForm((groupScheduleServiceTier?.name || '') + ' Questionnaire', groupScheduleServiceTier?.formId);

  const GroupScheduleSelectionAccordion = useAccordion('Select Time', <Grid container spacing={2}>
    <Grid item xs={4}>
      <GroupScheduleDateSelection />
    </Grid>
    <Grid item xs={4}>
      <GroupScheduleTimeSelection />
    </Grid>
  </Grid>);

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

        <ServiceForm />

        <TierForm />

        <GroupScheduleSelectionAccordion />

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            async function go() {
              if (groupScheduleServiceTier) {
                quote.serviceTierId = groupScheduleServiceTier.id;

                if (!quote.scheduleBracketSlotId) {
                  const { scheduleBracketSlotId, startDate } = firstAvailable;
                  quote.scheduleBracketSlotId = scheduleBracketSlotId;
                  quote.slotDate = startDate;
                }

                if (!serviceFormValid || !tierFormValid) {
                  setSnack({ snackType: 'error', snackOn: 'Please ensure all required fields are filled out.' });
                  return;
                }

                quote.serviceForm = serviceForm ? {
                  formVersionId: serviceForm.version.id,
                  submission: serviceForm.version.submission
                } : undefined;

                quote.tierForm = tierForm ? {
                  formVersionId: tierForm.version.id,
                  submission: tierForm.version.submission
                } : undefined;

                await postQuote(quote).unwrap();
                setSnack({ snackOn: 'Your request has been made successfully!' });
                navigate('/');
              }
            }
            void go();
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