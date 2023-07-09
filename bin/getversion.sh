#!/bin/sh

# Function to get the current version
get_version() {
  if [ -s VERSION ]; then
    cat VERSION
  else
    echo 0 > VERSION
    echo 0
  fi
}

# Function to increment the version
increment_version() {
  NEW_VERSION=$(get_version)
  VERS=$(($NEW_VERSION + 1))
  echo $VERS > VERSION
  echo $VERS
}

# Process command-line options
while getopts "gi" opt; do
  case ${opt} in
    g )
      get_version
      ;;
    i )
      increment_version
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      exit 1
      ;;
  esac
done



# VERSION=$(ssh -T $TAILSCALE_OPERATOR@$BUILD_HOST "cat /path/to/VERSION")
# MAJOR=$(echo $VERSION | cut -d. -f1)
# MINOR=$(echo $VERSION | cut -d. -f2)
# PATCH=$(echo $VERSION | cut -d. -f3)

# NEW_PATCH=$((PATCH + 1))
# NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"
