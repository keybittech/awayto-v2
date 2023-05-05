import React, { useContext } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useContexts } from 'awayto/hooks';
import { useNavigate } from 'react-router';

function OnboardGroup() {

  const navigate = useNavigate();

  const {
    groups,
    groupSchedules,
    groupServices,
    groupForms
  } = useContext(useContexts().GroupContext) as GroupContextType;

  const hasSchedule = !!groupSchedules.length;
  const hasForm = !!groupForms.length;
  const hasService = !!groupServices.length;

  const complete = hasSchedule && hasForm && hasService;

  if (complete) return <></>;

  return groups.map((group, i) => {
      return <Card key={`group-setup-${i}`}>
      <CardHeader title="Welcome!" subheader={`Complete the following set up for ${group.displayName as string}.`} />
      <CardContent>
        <Box mb={2}>
          <Alert severity={hasSchedule ? 'success' : 'info'} action={!hasSchedule && <Button onClick={() => navigate(`/group/${group.name}/manage/schedules`)}><ChevronRightIcon /></Button>}>1. Add a Master Schedule</Alert>
        </Box>
        <Box mb={2}>
          <Alert severity={hasForm ? 'success' : 'info'} action={!hasForm && <Button onClick={() => navigate(`/group/${group.name}/manage/forms`)}><ChevronRightIcon /></Button>}>2. Add a Form</Alert>
        </Box>
        <Box mb={2}>
          <Alert severity={hasService ? 'success' : 'info'} action={!hasService && <Button onClick={() => navigate(`/service`)}><ChevronRightIcon /></Button>}>3. Add a Service</Alert>
        </Box>
      </CardContent>
    </Card>
  });
}

export default OnboardGroup;