#!/bin/sh
read request

method=$(echo $request | awk '{print $1}')
uri=$(echo $request | awk '{print $2}')
content_length=0
content_type=""
expires_at=""
file_name=""

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
  elif [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "expires-at" ]; then
    expires_at=$value
  elif [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "content-disposition" ]; then
    file_name=$(echo "$value" | sed -n 's/^.*filename="\?\([^"]*\)".*$/\1/p')
  fi
done

if [ "$method" = "GET" ]; then
  rm -f last_get # LOGGING
  
  file_id=$(echo $uri | awk -F / '{print $3}') # Parse the file id from /file/123
  file_name=$(sqlite3 "$SQLITE_DATA" "SELECT name FROM files WHERE id = '$file_id';") # Use comma as a separator
  
  noop=$(sqlite3 "$SQLITE_DATA" "SELECT writefile('file_content.bin', content) FROM files WHERE id = '$file_id';") # Get file 
  file_length=$(wc -c < file_content.bin)

  echo "GET ATTRS $request $file_name" >> last_get # LOGGING

  echo -ne "HTTP/1.1 200 OK\r\nContent-Disposition: attachment; filename=\"$file_name\"\r\nContent-Type: application/octet-stream\r\nContent-Length: $file_length\r\n\r\n"

  dd if=file_content.bin bs=65536 2>/dev/null

  rm file_content.bin
elif [ "$method" = "PUT" ]; then
  rm -f last_put #LOGGING
  echo $request >> last_put

  file_id=$(echo $uri | awk -F / '{print $3}')
  echo "'$file_id', '$file_name', '$expires_at'" >> last_put # LOGGING

  sqlite3 "$SQLITE_DATA" "UPDATE files SET name = '$file_name', expires_at = '$expires_at' WHERE id = '$file_id';"
  echo -e "HTTP/1.1 200 OK\r\n\r\n"
elif [ "$method" = "POST" ]; then
  rm -f last_post # LOGGING
  echo "$(date '+%Y-%m-%d %H:%M:%S') $request" >> last_post # LOGGING

  insert_id=$(uuidgen) # Create a new id
  temp_file=$(mktemp) # Create a temporary file to store the blob in
  dd bs=1 count="$content_length" of="$temp_file" # Read the request and store it in temp_file

  original_size=$(stat -c%s "$temp_file") # LOGGING
  echo "'$insert_id', '$temp_file' size: '$original_size'" >> last_post # LOGGING

  sqlite3 "$SQLITE_DATA" "INSERT INTO files (id, content) VALUES ('$insert_id', readfile('$temp_file'));"

  rm "$temp_file"

  echo "Saved successfully." >> last_post # LOGGING

  echo -e "HTTP/1.1 201 Created\r\nContent-Type: text/plain\r\nContent-Length: ${#insert_id}\r\n\r\n$insert_id"
else
  echo -e "HTTP/1.1 405 Method Not Allowed\r\nAllow: GET, POST\r\n\r\n"
fi


