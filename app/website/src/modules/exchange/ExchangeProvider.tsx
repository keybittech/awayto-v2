import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { SocketMessage } from 'awayto/core';
import { sh, useComponents, useContexts } from 'awayto/hooks';

export function ExchangeProvider({ children }: IProps): React.JSX.Element {

  const { exchangeId } = useParams();
  if (!exchangeId) return <></>;

  const { ExchangeContext } = useContexts();
  const { WSTextProvider, WSCallProvider } = useComponents();

  const [topicMessages, setTopicMessages] = useState<SocketMessage[]>([]);

  const exchangeContext = {
    exchangeId,
    topicMessages,
    setTopicMessages,
    getBookingFiles: sh.useGetBookingFilesQuery({ id: exchangeId })
  } as ExchangeContextType | null;

  return useMemo(() => !ExchangeContext || !WSTextProvider || !WSCallProvider || !exchangeContext ? <></> :
    <ExchangeContext.Provider value={exchangeContext}>
      <WSTextProvider
        topicId={`exchange/text:${exchangeContext.exchangeId}`}
        topicMessages={topicMessages}
        setTopicMessages={setTopicMessages}
      >
        <WSCallProvider
          topicId={`exchange/call:${exchangeContext.exchangeId}`}
          topicMessages={topicMessages}
          setTopicMessages={setTopicMessages}
        >
          {children}
        </WSCallProvider>
      </WSTextProvider>
    </ExchangeContext.Provider>,
    [ExchangeContext, exchangeContext]
  );
}

export default ExchangeProvider;