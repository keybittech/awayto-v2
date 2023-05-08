#!/bin/sh
while true; do
  # Get the current time
  current_time=$(date +"%Y-%m-%d %H:%M:%S")

  # Get a list of expired files
  expired_files=$(sqlite3 -separator " | " "$SQLITE_DATA" "SELECT id, content, expires_at FROM files WHERE datetime(expires_at) < datetime('now');")

  if [ -n "$expired_files" ]; then
    echo "[$current_time] List of expired files:"
    echo "$expired_files"
    
    # Delete expired files and get the count of affected rows
    deleted_count=$(sqlite3 "$SQLITE_DATA" "BEGIN; DELETE FROM files WHERE datetime(expires_at) < datetime('now'); SELECT changes(); COMMIT;")
    echo "[$current_time] Deleted $deleted_count expired file(s)"
  else
    echo "[$current_time] No expired files found"
  fi

  sleep 60
done
