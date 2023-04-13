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
    return sortedTranscript.reduce<Record<string, string[]>>((acc, message) => {
      const { username, words: msg, date } = message;
      if (!acc[username]) acc[username] = [] as string[];
      const d = dayjs(date);
      const eventTime = d.format("h:mm a");
      acc[username].push(`${eventTime} - ${msg}`);
      return acc;
    }, {});
  }, [sortedTranscript]);

  const columns = [
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Message", dataIndex: "msg", key: "msg" },
  ];

  const dataSource = [];
  for (const username in groupedTranscript) {
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

  if (!messages || messages.length === 0) return null;

  const sortedTranscript = useMemo(() => {
    return messages.sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
  }, [messages]);

  const groupedTranscript = useMemo(() => {
    return sortedTranscript.reduce<Record<string, string[]>>((acc, message) => {
      const { username, words: msg, date } = message;
      if (!acc[username]) acc[username] = [] as string[];
      const d = dayjs(date);
      const eventTime = d.format("h:mm a");
      acc[username].push(`${eventTime} - ${msg}`);
      return acc;
    }, {});
  }, [sortedTranscript]);

  const columns = [
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Message", dataIndex: "msg", key: "msg" },
  ];

  const dataSource = [];
  for (const username in groupedTranscript) {
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

export default Transcript;
