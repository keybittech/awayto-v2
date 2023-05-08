#!/bin/sh
sh make-db.sh
sh server.sh &
sh expire-files.sh &
wait