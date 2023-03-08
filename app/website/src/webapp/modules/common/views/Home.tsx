import React from "react";
import { useComponents } from "awayto-hooks";

export function Home(props: IProps) {
  const { GroupHome, QuoteHome } = useComponents();
  return <>
    <GroupHome {...props} />
    <QuoteHome {...props} />
  </>
}

export default Home;