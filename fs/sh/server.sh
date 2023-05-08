#!/bin/sh
read request

method=$(echo $request | awk '{print $1}')
uri=$(echo $request | awk '{print $2}')

if [ "$method" = "GET" ]; then
  file_id=$(echo $uri | awk -F / '{print $3}')

  string=$(sqlite3 "$SQLITE_DATA" "SELECT content FROM files WHERE id = '$file_id';")

  echo -e "HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: ${#string}\n\n$string"
elif [ "$method" = "POST" ]; then
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

  insert_id=$(uuidgen)

  file_id=$(sqlite3 "$SQLITE_DATA" "INSERT INTO files (id, content, expires_at) VALUES ('$insert_id', '$file_contents', '$expires_at');")

  echo -e "HTTP/1.1 201 Created\nContent-Type: text/plain\nContent-Length: ${#insert_id}\n\n$insert_id"
else
  echo -e "HTTP/1.1 405 Method Not Allowed\nAllow: GET, POST\n\n"
fi


