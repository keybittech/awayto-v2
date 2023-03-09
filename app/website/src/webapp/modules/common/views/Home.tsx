import React from "react";
import { useComponents } from "awayto-hooks";

export function Home(props: IProps): JSX.Element {
  const { GroupHome, QuoteHome, PendingQuotesProvider } = useComponents();
  return <>
    <PendingQuotesProvider>
      <QuoteHome {...props} />
    </PendingQuotesProvider>
    <GroupHome {...props} />
  </>
}

export default Home;