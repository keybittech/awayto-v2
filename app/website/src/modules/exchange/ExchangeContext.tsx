import { createContext } from 'react';
import { SocketMessage } from 'awayto/core';

declare global {
  type ExchangeContextType = {
    exchangeId: string;
    topicMessages: SocketMessage[];
  }
}

export const ExchangeContext = createContext<ExchangeContextType | null>(null);

export default ExchangeContext;