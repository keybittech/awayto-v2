import { createContext } from "react";

export type ExchangeContextType = {
  chatLog: JSX.Element[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  canStartStop: string;
  localStreamElement: JSX.Element;
  senderStreamsElements: (JSX.Element | undefined)[];
  submitMessageForm: JSX.Element;
  setLocalStreamAndBroadcast: (prop: boolean) => void;
  leaveCall: () => void;
}

export const ExchangeContext = createContext<ExchangeContextType | null>(null);