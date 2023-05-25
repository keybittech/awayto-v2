import React, { useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

const dataUrl = window.location.origin + '/api/kiosk/gs/test.json';

export function Kiosk(): React.JSX.Element {
  
  const [data, setData] = useState<Record<string, string> | undefined>();

  const getData = () => {
    fetch(dataUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(async res => {
      if (res.ok) {
        const scheduleData = await res.json() as Record<string, string>;
        setData(scheduleData);
        localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
      } else {
        const scheduleData = JSON.parse(localStorage.getItem('scheduleData') || '{}') as Record<string, string>;
        setData(scheduleData);
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

  if (!data) return <CircularProgress />;
  console.log({ data })

  return <>
    <Card>
      <CardHeader title="Group Name Services" subheader="Please select a service from the following options." />
      <CardContent>
        <>
          <Typography>Last Update: {data.the_time}</Typography>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </>
      </CardContent>
    </Card>
  </>;
}

export default Kiosk;