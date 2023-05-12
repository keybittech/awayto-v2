import { IQuote } from 'awayto/core';
import { createContext } from 'react';

declare global {
  type PendingQuotesContextType = {
    pendingQuotes: IQuote[];
    pendingQuotesChanged: boolean;
    selectedPendingQuotes: string[];
    setSelectedPendingQuotes: (quotes: string[]) => void;
    handleSelectPendingQuote: (prop: string) => void;
    handleSelectPendingQuoteAll: () => void;
    approvePendingQuotes: () => void;
    denyPendingQuotes: () => void;
  }
}

export const PendingQuotesContext = createContext<PendingQuotesContextType | null>(null);

export default PendingQuotesContext;