#!/bin/sh
sqlite3 "$SQLITE_DATA" "CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, content BLOB NOT NULL, expires_at TEXT);"

socat -d TCP4-LISTEN:8000,fork,reuseaddr SYSTEM:"/app/server.sh" &

while true; do
  current_time=$(date +"%Y-%m-%d %H:%M:%S")

  expired_files=$(sqlite3 -separator " | " "$SQLITE_DATA" "SELECT id, content, expires_at FROM files WHERE datetime(expires_at) < datetime('now');")

  if [ -n "$expired_files" ]; then
    echo "[$current_time] List of expired files:"
    echo "$expired_files"
    
    deleted_count=$(sqlite3 "$SQLITE_DATA" "BEGIN; DELETE FROM files WHERE datetime(expires_at) < datetime('now'); SELECT changes(); COMMIT;")
    echo "[$current_time] Deleted $deleted_count expired file(s)"
  fi

  sleep 60
done &

wait