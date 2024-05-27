#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set -euo pipefail

if [ -z "${npm_execpath-}" ]; then
  echo "npm_execpath is not set"
  exit 1
fi

function start_server {
  if nc -z localhost 8080; then
    pid=$(lsof -i:8080 -t)
    echo "Server is already running pid $pid"
    exit 1
  fi

  local version=$1

  # export LLVM_PROFILE_FILE="$SCRIPT_DIR/clang_prof_exec.profraw"

  if [[ "$version" == "3.0.0" ]]; then
    # PYTHONPATH=$(realpath "$SCRIPT_DIR/../../..") "python" "$SCRIPT_DIR/new_api.py" &
    "python" "$SCRIPT_DIR/new_api.py" &
  else
    ./ephemeral_venv.sh -d "perspective-python==$version" python "$SCRIPT_DIR/old_api.py" &
  fi

  server_pid=$!
  echo "Server is starting pid $server_pid"

  cleanup() {
    echo "Cleaning up pid $server_pid"
    kill $server_pid || true
  }

  # Register the cleanup function to be called on the EXIT signal
  trap cleanup EXIT

  while ! nc -z localhost 8080; do
    sleep 0.1
  done

  echo "Server is up"
}

function stop_server {
  kill $server_pid || true
  wait $server_pid || true
  trap - EXIT
}

start_server 2.10.0
$npm_execpath bench_client -p 2.10.0 -o 2.10.0.arrow
stop_server

start_server 3.0.0
$npm_execpath bench_client -p 3.0.0 -o 3.0.0.arrow
stop_server

$npm_execpath tsx "$SCRIPT_DIR/merge_arrows.mts" 2.10.0.arrow 3.0.0.arrow -o merged.arrow
