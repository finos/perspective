#!/usr/bin/env bash

set -euo pipefail

function cleanup_venv {
  echo ""
  echo "Cleaning up virtual environment..."
  deactivate
  rm -rf "$temp_env"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create a temporary directory for the virtual environment
temp_env=$(mktemp -d)

# Create a virtual environment
python3 -m venv "$temp_env"

# Activate the virtual environment
source "$temp_env/bin/activate"
trap cleanup_venv EXIT

pip install -r "$SCRIPT_DIR/ephemeral_requirements.txt"

while getopts ":d:" opt; do
  case $opt in
  d)
    pip install "$OPTARG"
    ;;
  \?)
    echo "Invalid option: -$OPTARG" >&2
    exit 1
    ;;
  :)
    echo "Option -$OPTARG requires an argument." >&2
    exit 1
    ;;
  esac
done

# Shift off the options and arguments processed by getopts
shift $((OPTIND - 1))

# Execute additional commands provided to the script
"$@" &
PROCESS_PID=$!

cleanup() {
  kill $PROCESS_PID || true
  cleanup_venv || true
}

# trap cleanup EXIT SIGHUP
trap cleanup EXIT

wait $PROCESS_PID
