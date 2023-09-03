import React from 'react';

import Box from '@mui/material/Box';

import { useComponents } from 'awayto/hooks';

export function Home(props: IProps): React.JSX.Element {
  const { BookingHome, GroupHome, QuoteHome, PendingQuotesProvider } = useComponents();
  return (
    <>
      {/* <Box mb={2}>
        <BookingHome {...props} />
      </Box> */}
      <Box mb={2}>
        <GroupHome {...props} />
      </Box>
      <Box mb={2}>
        <PendingQuotesProvider>
          <QuoteHome {...props} />
        </PendingQuotesProvider>
      </Box>
    </>
  );
}

export default Home;
