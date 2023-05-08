#!/bin/sh
socat -d -d TCP4-LISTEN:8000,fork,reuseaddr SYSTEM:"/app/handle-request.sh" &
socat -d -d TCP4-LISTEN:8001,fork,reuseaddr SYSTEM:"/app/handle-post-request.sh"
