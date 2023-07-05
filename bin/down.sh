#!/bin/sh

. ./.env

# Define an array of servers to delete
SERVERS="ns1 ns2 exit app db svc build"

if [ ! "$DEPLOYMENT_LOCATION" = "local" ]; then

  # Check if all required options are set
  . ./bin/getopts.sh ts-api-token ts-organization
  if [ -z "$TAILSCALE_API_TOKEN" ] || [ -z "$TAILSCALE_ORGANIZATION" ]; then
    echo "Non-local deployments require --ts-api-token and --ts-organization. Or, export TAILSCALE_API_TOKEN and TAILSCALE_ORGANIZATION." >&2
    exit 1
  fi

  if [ -f ./sites/$PROJECT_PREFIX/aws ]; then
    echo "uninstalling from aws"
  elif [ -f ./sites/$PROJECT_PREFIX/hetzner ]; then
    echo "uninstalling from hetzner"

    # Check if hcloud is installed
    if ! command -v hcloud >/dev/null 2>&1; then
      echo "'hcloud' command line tool is required but not installed. Please install it and retry."
      exit 1
    fi

    # Loop over the array and delete each server on Hetzner and Tailscale
    for SERVER in $SERVERS; do
      ssh-keygen -R $PROJECT_PREFIX-$SERVER.$TAILSCALE_TAILNET

      # Remove the server on Hetzner
      echo "Removing server $PROJECT_PREFIX-$SERVER"
      hcloud server delete $PROJECT_PREFIX-$SERVER

      # Remove the machine through the Tailscale API
      echo "Removing the machine $PROJECT_PREFIX-$SERVER through the Tailscale API..."
      
      TAILSCALE_CLIENT_IDS=$(curl \
        -u "${TAILSCALE_API_TOKEN}:" \
        "https://api.tailscale.com/api/v2/tailnet/${TAILSCALE_ORGANIZATION}/devices" \
        | jq -r '.devices[] | select(.hostname=="'"$PROJECT_PREFIX-$SERVER"'").id')

      echo "Found client id(s):"
      echo "${TAILSCALE_CLIENT_IDS}"
      for CLIENT_ID in ${TAILSCALE_CLIENT_IDS}
      do
        echo "Removing client id $CLIENT_ID"
        curl \
          -u "${TAILSCALE_API_TOKEN}:" \
          -X DELETE \
          "https://api.tailscale.com/api/v2/device/${CLIENT_ID}"
      done
    done

    hcloud firewall delete "$PROJECT_PREFIX-ns-firewall"
    hcloud firewall delete "$PROJECT_PREFIX-ts-firewall"
    hcloud firewall delete "$PROJECT_PREFIX-public-firewall"

    # hcloud network delete "$PROJECT_PREFIX-network"

  fi

  rm -rf ./sites/$PROJECT_PREFIX
fi
