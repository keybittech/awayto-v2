import { IQuote } from "awayto";
import { createContext } from "react";

export type PendingQuotesContextType = {
  pendingQuotes: IQuote[];
  pendingQuotesChanged: boolean;
  selectedPendingQuotes: IQuote[];
  setSelectedPendingQuotes: (quotes: IQuote[]) => void;
  handleSelectPendingQuote: (prop: IQuote) => void;
  handleSelectPendingQuoteAll: () => void;
  approvePendingQuotes: () => void | Promise<void>;
  denyPendingQuotes: () => void | Promise<void>;
}

export const PendingQuotesContext = createContext<PendingQuotesContextType | null>(null);