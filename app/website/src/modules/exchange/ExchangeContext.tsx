import { createContext } from 'react';
import { SocketMessage } from 'awayto/core';
import { UseQueryHookResult } from '@reduxjs/toolkit/dist/query/react/buildHooks';
import { SiteEndpointDefinitions } from 'awayto/hooks';

declare global {
  type ExchangeContextType = {
    exchangeId: string;
    topicMessages: SocketMessage[];
    setTopicMessages(selector: (prop: Partial<SocketMessage>[]) => SocketMessage[]): void;
    getBookingFiles: UseQueryHookResult<SiteEndpointDefinitions['getBookingFiles']>;
  }
}

export const ExchangeContext = createContext<ExchangeContextType | null>(null);

export default ExchangeContext;