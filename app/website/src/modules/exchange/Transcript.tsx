const duration =
  sortedTranscript[sortedTranscript.length - 1].timestamp -
  sortedTranscript[0].timestamp +
  1;
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

  const sortedTranscript = messages
    ?.slice()
    .sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)));

  const columns = [
    { title: "Username", field: "username" },
    { title: "Messages", field: "text" },
  ];

  const data = sortedTranscript.reduce((acc, { username, words }) => {
    const rows: any[] = acc[username] || [];
    const wordsArr = words.split(" ");
    const wordsPerSec = wordsArr.length / duration;
    const numLines = Math.ceil(wordsArr.length / (20 / wordsPerSec));
    const wordsPerLine = Math.ceil(wordsArr.length / numLines);

    for (let i = 0; i < numLines; i++) {
      const lineWords = wordsArr.slice(
        i * wordsPerLine,
        (i + 1) * wordsPerLine
      );
      const lineText = lineWords.join(" ");
      rows.push({ text: lineText });
    }

    acc[username] = rows;
    return acc;
  }, {});

  return <MaterialTable title="Transcript" columns={columns} data={data} />;

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
