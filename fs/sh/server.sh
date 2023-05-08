#!/bin/sh
read request

method=$(echo $request | awk '{print $1}')
uri=$(echo $request | awk '{print $2}')

if [ "$method" = "GET" ]; then
  rm -f last_get # LOGGING
  file_id=$(echo $uri | awk -F / '{print $3}')

  file_content=$(sqlite3 "$SQLITE_DATA" "SELECT content FROM files WHERE id = '$file_id';")
  echo $request $file_content >> last_get # LOGGING

  echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${#file_content}\r\n\r\n$file_content"
elif [ "$method" = "POST" ]; then
  rm -f last_post # LOGGING
  echo $request >> last_post # LOGGING
  content_length=0
  expires_at=""
  while read -r header; do
    header=$(echo "$header" | tr -d '\r')
    echo $header >> last_post # LOGGING
    if [ -z "$header" ]; then
      break
    fi
    key=$(echo "$header" | cut -d: -f1)
    value=$(echo "$header" | cut -d: -f2- | sed -e 's/^[[:space:]]*//' -e "s/'/''/g")

    if [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "content-length" ]; then
      content_length=$value
    elif [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "expires-at" ]; then
      expires_at=$value
    fi
  done

  read -n "$content_length" file_contents
  echo $file_contents >> last_post # LOGGING

  insert_id=$(uuidgen)
  
  
  echo $insert_id $expires_at $file_contents >> last_post # LOGGING

  sqlite3 "$SQLITE_DATA" "INSERT INTO files (id, content, expires_at) VALUES ('$insert_id', '$file_contents', '$expires_at');"

  echo "Saved successfully." >> last_post # LOGGING

  echo -e "HTTP/1.1 201 Created\r\nContent-Type: text/plain\r\nContent-Length: ${#insert_id}\r\n\r\n$insert_id"
else
  echo -e "HTTP/1.1 405 Method Not Allowed\r\nAllow: GET, POST\r\n\r\n"
fi


