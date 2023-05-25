import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import { sh, useUtil, useAccordion, useComponents, useGroupForm } from 'awayto/hooks';

export function ExchangeSummary(): React.JSX.Element {
  const { summaryId } = useParams();
  if (!summaryId) return <></>;

  const { AccordionWrap, ExchangeRating } = useComponents();
  const { setSnack } = useUtil();

  const [didSubmit, setDidSubmit] = useState(false);
  const { data: booking } = sh.useGetBookingByIdQuery({ id: summaryId || '' }, { skip: !summaryId });

  const {
    form: serviceSurvey,
    comp: ServiceSurvey,
    valid: serviceSurveyValid
  } = useGroupForm(booking?.serviceSurveyId);

  const {
    form: tierSurvey,
    comp: TierSurvey,
    valid: tierSurveyValid
  } = useGroupForm(booking?.tierSurveyId);

  const noSurveys = !booking?.serviceSurveyId && !booking?.tierSurveyId;

  const ServiceSurveyAccordion = useAccordion((booking?.serviceName || '') + ' Questionnaire', didSubmit && !serviceSurveyValid, true);
  const TierSurveyAccordion = useAccordion((booking?.serviceTierName || '') + ' Questionnaire', didSubmit && !tierSurveyValid, true);

  return <>
    <Card sx={{ mb: 2 }}>
      <CardHeader title="Summary Review" subheader="Your feedback is important and helps make services better." />
      <CardContent>
        <ExchangeRating rating={booking?.rating} exchangeId={summaryId} />
      </CardContent>
    </Card>

    {noSurveys ? <Alert severity="info">
      This service requires no further feedback. Thank you!
    </Alert> : <>
      {serviceSurvey && <AccordionWrap {...ServiceSurveyAccordion}>
        <ServiceSurvey />
      </AccordionWrap>}

      {tierSurvey && <AccordionWrap {...TierSurveyAccordion}>
        <TierSurvey />
      </AccordionWrap>}

      
      <Card>
        <CardActionArea onClick={() => {
          if (!serviceSurveyValid || !tierSurveyValid) {
            setSnack({ snackType: 'error', snackOn: 'Please ensure all required fields are filled out.' });
            setDidSubmit(true);
            return;
          }

          setDidSubmit(false);
        }}>
          <Box m={2} sx={{ display: 'flex' }}>
            <Typography color="secondary" variant="button">Submit Request</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </>}

  </>;
}

export default ExchangeSummary;