import React, { useMemo } from 'react';
import dayjs from 'dayjs';

import { ITranscriptMessage } from 'awayto/core';

declare global {
  interface IProps {
    messages?: ITranscriptMessage[];
  }
}

function Transcript({ messages }: IProps): JSX.Element {
  if (!messages) return <></>;
  const sortedTranscript = useMemo(
    () => messages.sort((a, b) => dayjs(a.timestamp).millisecond() - dayjs(b.timestamp).millisecond()),
    [messages]
  );

  const groupedTranscript = useMemo(() => {
    return sortedTranscript.reduce<Record<string, string[]>>((acc, message) => {
      const { username, words: msg } = message;
      if (!acc[username]) acc[username] = [] as string[];
      acc[username].push(msg);
      return acc;
    }, {});
  }, [sortedTranscript]);

  const messagesLines = useMemo(() => {
    const lines = [] as Record<string, string>[];
    sortedTranscript.forEach(({ username, words: wrds, duration }) => {
      const words = wrds.split(' ');
      const wordsPerSec = words.length / duration;
      const numLines = Math.ceil(words.length / (20 / wordsPerSec));
      const wordsPerLine = Math.ceil(words.length / numLines);

      for (let i = 0; i < numLines; i++) {
        const lineWords = words.slice(i * wordsPerLine, (i + 1) * wordsPerLine);
        const lineText = lineWords.join(' ');
        lines.push({ username, text: lineText });
      }
    });
    return lines;
  }, [sortedTranscript]);

  return (
    <ul>
      {Object.keys(groupedTranscript).map((username) => (
        <li key={username}>
          <h3>{username}</h3>
          <ul>
            {messagesLines
              .filter((line) => line.username === username)
              .map(({ text }, index) => (
                <li key={index}>{text}</li>
              ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export default Transcript;