import React from "react";
import { useComponents } from "awayto-hooks";

export function Home(props: IProps): JSX.Element {
  const { BookingHome, GroupHome, QuoteHome, PendingQuotesProvider } = useComponents();
  return <>
    <BookingHome {...props} />
    <PendingQuotesProvider>
      <QuoteHome {...props} />
    </PendingQuotesProvider>
    <GroupHome {...props} />
  </>
}

export default Home;