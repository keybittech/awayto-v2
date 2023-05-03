import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { useComponents, useContexts, sh, useUtil, useGroupForm } from 'awayto/hooks';

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
    selectedTime,
    GroupScheduleSelectionPickers
  } = useContext(GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;

  const [serviceForm, ServiceForm] = useGroupForm(groupScheduleService?.name, groupScheduleService?.formId);
  const [tierForm, TierForm] = useGroupForm(groupScheduleServiceTier?.name, groupScheduleServiceTier?.formId);

  if (!groupSchedule || !GroupSelect) return <></>;
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

        <GroupScheduleSelectionPickers />

        <FileManager {...props} />
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={() => {
            async function go() {
              if (selectedTime || groupScheduleServiceTier) {
                quote.serviceTierId = groupScheduleServiceTier.id;
    
                if (!quote.scheduleBracketSlotId) {
                  const { scheduleBracketSlotId, startDate } = firstAvailable;
                  quote.scheduleBracketSlotId = scheduleBracketSlotId;
                  quote.slotDate = startDate;
                }
    
                if (Object.keys(serviceForm).length) {
                  const missingValues = Object.keys(serviceForm.version.form).some(rowId => serviceForm.version.form[rowId].some((field, i) => field.r && [undefined, ''].includes(serviceForm.version.submission[rowId][i])));
                  if (missingValues) {
                    setSnack({ snackType: 'error', snackOn: 'The Service Questionnaire is missing required fields!' });
                    return;
                  }
                  quote.serviceForm = {
                    formVersionId: serviceForm.version.id,
                    submission: serviceForm.version.submission
                  }
                }
    
                if (Object.keys(tierForm).length) {
                  const missingValues = Object.keys(tierForm.version.form).some(rowId => tierForm.version.form[rowId].some((field, i) => field.r && [undefined, ''].includes(tierForm.version.submission[rowId][i])));
                  if (missingValues) {
                    setSnack({ snackType: 'error', snackOn: 'The Tier Questionnaire is missing required fields!' });
                    return;
                  }
                  quote.tierForm = {
                    formVersionId: tierForm.version.id,
                    submission: tierForm.version.submission
                  }
                }
    
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