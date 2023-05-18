import React, { createContext } from 'react';

declare global {
  type WSCallContextType = {
    audioOnly: boolean;
    connected: boolean;
    canStartStop: string;
    localStreamElement: React.JSX.Element;
    senderStreamsElements: (React.JSX.Element | undefined)[];
    setLocalStreamAndBroadcast: (prop: boolean) => void;
    leaveCall: () => void;
  }
}

export const WSCallContext = createContext<WSCallContextType | null>(null);

export default WSCallContext;