import React, { useEffect } from "react";

import { IQuoteActionTypes } from "awayto";
import { useRedux, useApi } from "awayto-hooks";

const { GET_QUOTES } = IQuoteActionTypes;

function QuoteHome (props: IProps) {

  const api = useApi();

  const { quotes } = useRedux(state => state.quote);

  useEffect(() => {
    const [abort, res] = api(GET_QUOTES);
    res?.catch(console.warn);
    return () => abort();
  }, [])

  return <pre>
    {Object.values(quotes).map((q, i) => <p key={i}>{q.id}</p>)}
  </pre>
}

export default QuoteHome;