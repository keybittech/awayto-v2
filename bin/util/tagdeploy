#!/bin/sh

SERVICES="wcapp wcapi wcauth wcsock wcturn wcfs"

for SERVICE in $SERVICES; do
  # Tag and push services to private registry
  ssh $TAILSCALE_OPERATOR@$BUILD_HOST "sudo docker tag $SERVICE localhost:5000/$SERVICE && sudo docker push localhost:5000/$SERVICE"
done