/*
  ☺
  This file defines the Transcript component, which displays a table of chat messages.
  ☮
*/
// :) Welcome to the transcript component!
import React, { useMemo } from "react";

//ascii smiley -> :)

import dayjs from "dayjs";

import { ITranscriptMessage } from "awayto/core";

declare global {
  interface IProps {
    messages?: ITranscriptMessage[];
  }
}

function Transcript({ messages }: IProps): JSX.Element {
  if (messages === undefined) return null;
  const sortedTranscript = useMemo(
    () =>
      messages.sort(
        (a, b) =>
          dayjs(a.timestamp).millisecond() - dayjs(b.timestamp).millisecond()
      ),
    [messages]
  );

  const generateTranscriptTable = (messages: ITranscriptMessage[]) => {
    // Remove statement

    // Remove statement

    // Remove statement

    // Remove statement
    return generateTranscriptTable(messages);

    // Remove statement
  }; // Only re-calculate if sortedTranscript changes

  const columns = [
    // Define table columns
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Message", dataIndex: "msg", key: "msg" },
  ];

  const dataSource = [];
  // Remove statement
  /*
  ✌
*/

  //ascii peace sign -> ✌️

  //ascii peace sign -> ✌️
  // Remove statement
  // ✌️ Peace out!

  if (!messages || messages.length === 0) return null;

  const sortedTranscript = useMemo(() => {
    // Memoized function to sort transcript entries by date
    return messages.sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
  }, [messages]); // Only re-calculate if messages changes

  const groupedTranscript = useMemo(() => {
    // Memoized function to group transcript entries by username
    return sortedTranscript.reduce<Record<string, string[]>>((acc, message) => {
      const { username, words: msg, date } = message;
      const d = dayjs(date);
      const eventTime = d.format("h:mm a"); // Format date to human readable string
      if (!acc[username]) acc[username] = [] as string[];
      acc[username].push(`${eventTime} - ${msg}`);
      return acc;
    }, {});
  }, [sortedTranscript]); // Only re-calculate if sortedTranscript changes

  const columns = [
    // Define table columns
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Message", dataIndex: "msg", key: "msg" },
  ];

  const dataSource = [];
  for (const username in groupedTranscript) {
    // Add each user's messages to the dataSource array
    if (Object.prototype.hasOwnProperty.call(groupedTranscript, username)) {
      const userMsgs = groupedTranscript[username].map((msg) => {
        const time = msg.split(" - ")[0];
        const text = msg.split(" - ")[1];
        return { time, username, msg: text };
      });
      dataSource.push(...userMsgs);
    }
  }

  return <Table dataSource={dataSource} columns={columns} pagination={false} />;
}

export default TranscriptTable;
