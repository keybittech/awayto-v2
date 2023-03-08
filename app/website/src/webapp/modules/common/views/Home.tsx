import React from "react";
import { useComponents } from "awayto-hooks";


export function Home(props: IProps) {
  const { GroupsHome } = useComponents();
  return <>
    <GroupsHome {...props} />
  </>
}

export default Home;