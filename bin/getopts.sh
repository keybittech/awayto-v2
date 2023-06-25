#!/bin/sh

for arg in "$@"
do
  shift
  case "$arg" in
    "--ts-auth-key") 
      set -- "$@" "-k" ;;
    "--ts-api-token") 
      set -- "$@" "-t" ;;
    "--ts-tailnet") 
      set -- "$@" "-n" ;;
    *) 
      set -- "$@" "$arg"
  esac
done

while getopts k:t:n: option
do
  case "${option}" in
    k) 
      TAILSCALE_AUTH_KEY=${TAILSCALE_AUTH_KEY:-${OPTARG}} ;;
    t) 
      TAILSCALE_API_TOKEN=${TAILSCALE_API_TOKEN:-${OPTARG}} ;;
    n) 
      TAILSCALE_TAILNET=${TAILSCALE_TAILNET:-${OPTARG}} ;;
    \?) 
      echo "Invalid option: -$OPTARG" >&2
      exit 1 ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1 ;;
  esac
done
