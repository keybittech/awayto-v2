import React, { createContext } from "react";

declare global {
  type ExchangeContextType = {
    chatLog: React.JSX.Element[];
    messagesEndRef: React.RefObject<HTMLDivElement>;
    canStartStop: string;
    localStreamElement: React.JSX.Element;
    senderStreamsElements: (React.JSX.Element | undefined)[];
    submitMessageForm: React.JSX.Element;
    setLocalStreamAndBroadcast: (prop: boolean) => void;
    leaveCall: () => void;
  }
}

export const ExchangeContext = createContext<ExchangeContextType | null>(null);

export default ExchangeContext;