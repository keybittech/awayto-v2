import { IQuote } from 'awayto/core';
import { createContext } from 'react';

export type PendingQuotesContextType = {
  pendingQuotes: IQuote[];
  pendingQuotesChanged: boolean;
  selectedPendingQuotes: string[];
  setSelectedPendingQuotes: (quotes: string[]) => void;
  handleSelectPendingQuote: (prop: string) => void;
  handleSelectPendingQuoteAll: () => void;
  approvePendingQuotes: () => void;
  denyPendingQuotes: () => void;
}

export const PendingQuotesContext = createContext<PendingQuotesContextType | null>(null);