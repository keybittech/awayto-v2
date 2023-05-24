import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import { sh, useContexts } from 'awayto/hooks';

const ratings = ['🙁','🙂'];

export function ExchangeSummary(): React.JSX.Element {
  const { summaryId } = useParams();

  const { data: booking } = sh.useGetBookingByIdQuery({ id: summaryId || '' }, { skip: !summaryId });

  console.log({ SUMMARYBOOKING: booking })

  const [rating, setRating] = useState(0);

  return <>
    <Card>
      <CardHeader title="Summary Review" subheader="Your feedback is important and helps make services better." />
      <CardContent>
        <Typography variant="h6">1-Click Rating</Typography>
        {rating <= 0 && ratings.map((r, i) => <Tooltip key={`rating_${i}`} title={`Rating: ${i + 1}`} children={
          <IconButton onClick={() => setRating(i + 1)}>{r}</IconButton>
        } />)}
        {rating > 0 && <Typography>{`Your rating: ${ratings[rating-1]} ${rating}`}</Typography>}
      </CardContent>
    </Card>
  </>;
}

export default ExchangeSummary;