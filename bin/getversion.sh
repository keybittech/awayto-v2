#!/bin/sh

# Function to get the current version
get_version() {
  if [ -s version.txt ]; then
    cat version.txt
  else
    echo 0 > version.txt
    echo 0
  fi
}

# Function to increment the version
increment_version() {
  VERSION=$(get_version)
  VERSION=$((version + 1))
  echo $VERSION > version.txt
  echo $VERSION
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
