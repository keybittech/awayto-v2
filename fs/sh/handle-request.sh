#!/bin/sh
read request

method=$(echo $request | awk '{print $1}')
uri=$(echo $request | awk '{print $2}')

file_id=$(echo $uri | awk -F / '{print $3}')

string=$(sqlite3 "$SQLITE_DATA" "SELECT content FROM files WHERE id = $file_id;")

echo -e "HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: ${#string}\n\n$string"
