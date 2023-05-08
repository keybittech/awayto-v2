#!/bin/sh
read request

method=$(echo $request | awk '{print $1}')
uri=$(echo $request | awk '{print $2}')

if [ "$method" != "POST" ]; then
  echo -e "HTTP/1.1 405 Method Not Allowed\nAllow: POST\n\n"
  exit 0
fi

content_length=0
expires_at=""
while read -r header; do
  header=$(echo "$header" | tr -d '\r')
  if [ -z "$header" ]; then
    break
  fi
  key=$(echo "$header" | cut -d: -f1)
  value=$(echo "$header" | cut -d: -f2- | sed -e 's/^[[:space:]]*//' -e "s/'/''/g")

  if [ "$key" = "Content-Length" ]; then
    content_length=$value
  elif [ "$key" = "Expires-At" ]; then
    expires_at=$value
  fi
done

read -n "$content_length" file_contents

echo "INSERT INTO files (content, expires_at) VALUES ('$file_contents', '$expires_at'); SELECT last_insert_rowid();" >> testlog

file_id=$(sqlite3 "$SQLITE_DATA" "INSERT INTO files (content, expires_at) VALUES ('$file_contents', '$expires_at'); SELECT last_insert_rowid();")

echo -e "HTTP/1.1 201 Created\nContent-Type: text/plain\nContent-Length: ${#file_id}\n\n$file_id"
