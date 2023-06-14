#!/bin/sh

. ./.env

# Check if hcloud is installed
if ! command -v hcloud >/dev/null 2>&1; then
  echo "'hcloud' command line tool is required but not installed. Please install it and retry."
  exit 1
fi

# Define an array of servers to delete
SERVERS="$PROJECT_PREFIX-ns1 $PROJECT_PREFIX-ns2"

# Loop over the array and delete each server on Hetzner and Tailscale
for SERVER in $SERVERS; do
  ssh-keygen -R $(tailscale ip -4 $SERVER)

  # Remove the server on Hetzner
  echo "Removing server $SERVER"
  hcloud server delete $SERVER

  # Remove the machine through the Tailscale API
  echo "Removing the machine $SERVER through the Tailscale API..."
  
  TAILSCALE_CLIENT_IDS=$(curl \
    -u "${TS_API_ACCESS_TOKEN}:" \
    "https://api.tailscale.com/api/v2/tailnet/${TS_TAILNET}/devices" \
    | jq -r '.devices[] | select(.hostname=="'"$SERVER"'").id')

  echo "Found client id(s):"
  echo "${TAILSCALE_CLIENT_IDS}"
  for CLIENT_ID in ${TAILSCALE_CLIENT_IDS}
  do
    echo "Removing client id $CLIENT_ID"
    curl \
      -u "${TS_API_ACCESS_TOKEN}:" \
      -X DELETE \
      "https://api.tailscale.com/api/v2/device/${CLIENT_ID}"
  done
done

hcloud firewall delete $PROJECT_PREFIX-firewall

rm -rf ./deployed