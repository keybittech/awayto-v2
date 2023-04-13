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

  const groupedTranscript = useMemo(() => {
    return messages?.reduce<Record<string, ITranscriptMessage[]>>(
      (acc, message) => {
        const { username } = message;
        if (!acc[username]) acc[username] = [];
        acc[username].push(message);
        return acc;
      },
      {}
    );
  }, [messages]);

  const messagesLines = useMemo(() => {
    const lines = [] as Record<string, string>[];
    if (messages) {
      messages.forEach(({ username, words: wrds, duration }) => {
        const words = wrds.split(" ");
        const wordsPerSec = words.length / duration;
        const numLines = Math.ceil(words.length / (20 / wordsPerSec));
        const wordsPerLine = Math.ceil(words.length / numLines);

        for (let i = 0; i < numLines; i++) {
          const lineWords = words.slice(
            i * wordsPerLine,
            (i + 1) * wordsPerLine
          );
          const lineText = lineWords.join(" ");
          lines.push({ username, text: lineText });
        }
      });
    }
    return lines;
  }, [messages]);

  return (
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(groupedTranscript).map((username) => (
          <tr key={username}>
            <td>{username}</td>
            <td>
              <ul>
                {messagesLines
                  .filter((line) => line.username === username)
                  .map(({ text }, index) => (
                    <li key={index}>{text}</li>
                  ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Transcript;
