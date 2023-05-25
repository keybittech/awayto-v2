import React, { useEffect, useState } from 'react';

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { sh } from 'awayto/hooks';

const ratings = ['🙁','🙂'];

declare global {
  interface IProps {
    exchangeId?: string;
    rating?: string;
  }
}

export function ExchangeRating({ exchangeId, rating }: Required<IProps>): React.JSX.Element {
  const [changing, setChanging] = useState(false);
  const [putBookingRating, { data: ratingData }] = sh.usePutBookingRatingMutation();

  const [currentRating, setCurrentRating] = useState(0);

  useEffect(() => {
    if (ratingData?.rating || rating) {
      setCurrentRating(parseInt(ratingData?.rating || rating) || 0);
      setChanging(false);
    }
  }, [ratingData, rating]);

  return <>
    <Typography variant="button">1-Click Rating</Typography>
    <Typography variant="body1">
      {!currentRating || changing && ratings.map((r, i) => <Tooltip key={`rating_${i}`} title={`Rate the Appointment`} children={
        <IconButton onClick={() => {
          putBookingRating({ id: exchangeId, rating: (i + 1).toString() }).catch(console.error);
        }}>{r}</IconButton>
      } />)}
    </Typography>
      {!changing && currentRating > 0 && <>
        {`Your rating: ${ratings[currentRating-1]} ${currentRating}`}
        <Typography sx={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setChanging(true)}>Change</Typography>
      </>}
  </>;
}

export default ExchangeRating;