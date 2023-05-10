#!/bin/sh
read request

method=$(echo $request | awk '{print $1}')
uri=$(echo $request | awk '{print $2}')
content_length=0
content_type=""
expires_at=""
file_name=""
file_ext=""

while read -r header; do
  header=$(echo "$header" | tr -d '\r')
  echo "$(date '+%Y-%m-%d %H:%M:%S') $header" >> last_post
  if [ -z "$header" ]; then
    break
  fi
  key=$(echo "$header" | cut -d: -f1)
  value=$(echo "$header" | cut -d: -f2- | sed -e 's/^[[:space:]]*//' -e "s/'/''/g")

  if [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "content-length" ]; then
    content_length=$value
  elif [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "content-type" ]; then
    content_type=$value
  elif [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "expires-at" ]; then
    expires_at=$value
  elif [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "content-disposition" ]; then
    file_name=$(echo "$value" | sed -n 's/^.*filename="\?\([^"]*\)".*$/\1/p')
    file_ext=$(echo "$file_name" | sed -n 's/.*\.\([^\.]*\)$/\1/p')
  fi
done

if [ "$method" = "GET" ]; then
  rm -f last_get # LOGGING
  file_id=$(echo $uri | awk -F / '{print $3}')

  read -r file_content file_type file_name < <(sqlite3 "$SQLITE_DATA" "SELECT content, mime_type, name || '.' || ext AS file_name FROM files WHERE id = '$file_id';")
  echo "$(date '+%Y-%m-%d %H:%M:%S') $request $file_content" >> last_get # LOGGING

  echo -e "HTTP/1.1 200 OK\r\nContent-Disposition: attachment; filename=\"$file_name\"\r\nContent-Type: $file_type\r\nContent-Length: ${#file_content}\r\n\r\n$file_content"
elif [ "$method" = "PUT" ]; then
  rm -f last_put #LOGGING
  echo $request >> last_put

  file_id=$(echo $uri | awk -F / '{print $3}')
  echo "'$file_id', '$file_name', '$file_ext', '$content_type', '$expires_at'" >> last_put # LOGGING

  sqlite3 "$SQLITE_DATA" "UPDATE files SET name = '$file_name', ext = '$file_ext', mime_type = '$content_type', expires_at = '$expires_at' WHERE id = '$file_id';"
  echo -e "HTTP/1.1 200 OK"
elif [ "$method" = "POST" ]; then
  rm -f last_post # LOGGING
  echo "$(date '+%Y-%m-%d %H:%M:%S') $request" >> last_post # LOGGING

  read -n "$content_length" file_contents

  insert_id=$(uuidgen)
  
  echo "'$insert_id', '$file_contents'" >> last_post # LOGGING

  sqlite3 "$SQLITE_DATA" "INSERT INTO files (id, content) VALUES ('$insert_id', '$file_contents');"

  echo "Saved successfully." >> last_post # LOGGING

  echo -e "HTTP/1.1 201 Created\r\nContent-Type: text/plain\r\nContent-Length: ${#insert_id}\r\n\r\n$insert_id"
else
  echo -e "HTTP/1.1 405 Method Not Allowed\r\nAllow: GET, POST\r\n\r\n"
fi


