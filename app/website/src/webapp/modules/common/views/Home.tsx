import React from "react";
import { useComponents } from "awayto-hooks";

export function Home(props: IProps) {
  const { GroupHome, QuoteHome } = useComponents();
  return <>
    <QuoteHome {...props} />
    <GroupHome {...props} />
  </>
}

export default Home;