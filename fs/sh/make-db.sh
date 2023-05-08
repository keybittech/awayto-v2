#!/bin/sh
sqlite3 "$SQLITE_DATA" "CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY, content BLOB NOT NULL, expires_at TEXT);"