import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import DoubleArrorIcon from '@mui/icons-material/DoubleArrow';

import { useComponents } from 'awayto/hooks';
import { IKiosk } from 'awayto/core';

export function Kiosk(): React.JSX.Element {
  const { groupName, scheduleName } = useParams();
  if (!groupName) return <></>;

  const { ScheduleDisplay } = useComponents();

  const [scheduleId, setScheduleId] = useState(scheduleName);
  const [kiosk, setKiosk] = useState<IKiosk | undefined>();

  const scheduleKeys = useMemo(() => Object.keys(kiosk?.schedules || {}), [kiosk]);

  if (scheduleKeys.length && !scheduleId) {
    setScheduleId(scheduleKeys[0]);
  }

  const getData = () => {
    fetch(window.location.origin + `/api/kiosk/gs/${groupName}.json`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async res => {
      if (res.ok) {
        const kioskData = await res.json() as IKiosk;
        setKiosk(kioskData);
        localStorage.setItem('kioskData', JSON.stringify(kioskData));
      } else {
        const kioskData = JSON.parse(localStorage.getItem('kioskData') || '{}') as IKiosk;
        setKiosk(kioskData);
      }
    }).catch(console.error);
  }

  useEffect(() => {
    getData();
    const interval: NodeJS.Timeout = setInterval(getData, 60 * 1000);
    return () => {
      clearInterval(interval);
    }
  }, []);

  return <Box sx={{ display: 'flex', placeContent: 'center', width: '100%', height: '100vh' }}>
    {!kiosk?.schedules || !scheduleId ? <Alert sx={{ placeSelf: 'center' }} severity="info">
      No schedules are currently active.
    </Alert> : <Card sx={{ width: '100%' }}>
      <CardHeader title="Group Name Services" subheader="The following times are currently available." />
      <CardContent>
        {!scheduleName && <TextField
          sx={{ width: 300 }}
          select
          label="Group Schedule"
          value={scheduleId}
          onChange={e => setScheduleId(e.target.value)}
          >
          {scheduleKeys.map((sk, i) => <MenuItem key={`sched_id_sel${i}`} value={sk}>{sk}</MenuItem>)}
        </TextField>}
        <Box>
          <Typography variant="caption">Last Update: {kiosk.updatedOn}</Typography>
        </Box>
        <Box sx={{ my:2, width: '100%', height: '100%' }}>
          <ScheduleDisplay isKiosk={true} schedule={kiosk.schedules[scheduleId]} />
          <Button variant="contained" sx={{ mt: 4, fontSize: '1.5rem'}} onClick={() => window.location.assign(`${window.location.origin}/join/${kiosk.code}`)} endIcon={<DoubleArrorIcon />}>
            Create account to schedule your appointment
          </Button>
        </Box>
        <Link sx={{ cursor: 'pointer' }} onClick={() => window.location.assign(`${window.location.origin}/app`)}>Already have an account?</Link>
      </CardContent>
    </Card>}
  </Box>;
}

export default Kiosk;