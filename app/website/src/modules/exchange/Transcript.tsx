import React, { useMemo } from "react";
import dayjs from "dayjs";

import { ITranscriptMessage } from "awayto/core";

declare global {
  interface IProps {
    messages?: ITranscriptMessage[];
  }
}

function Transcript({ messages }: IProps): JSX.Element {
  if (!messages) return <></>;
  const sortedTranscript = useMemo(
    () =>
      messages.sort(
        (a, b) =>
          dayjs(a.timestamp).millisecond() - dayjs(b.timestamp).millisecond()
      ),
    [messages]
  );

  const groupedTranscripts = useMemo(() => {
    return sortedTranscript.reduce<Record<string, string[]>>((acc, message) => {
      const { username, words } = message;
      if (!acc[username]) acc[username] = [] as string[];
      acc[username].push(words);
      return acc;
    }, {});
  }, [sortedTranscript]);

  const messageLines = useMemo(() => {
    const lines = [] as Record<string, string>[];
    sortedTranscript.forEach(({ username, words, duration }) => {
      const splitWords = words.split(" ");
      const wordsPerSec = splitWords.length / duration;
      const numLines = Math.ceil(splitWords.length / (20 / wordsPerSec));
      const wordsPerLine = Math.ceil(splitWords.length / numLines);

      for (let i = 0; i < numLines; i++) {
        const lineWords = splitWords.slice(
          i * wordsPerLine,
          (i + 1) * wordsPerLine
        );
        const lineText = lineWords.join(" ");
        lines.push({ username, text: lineText });
      }
    });
    return lines;
  }, [sortedTranscript]);

  return (
    <ul>
      {Object.keys(groupedTranscripts).map((username) => (
        <li key={username}>
          <h3>{username}</h3>
          <ul>
            {messageLines
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
