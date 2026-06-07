#!/bin/zsh
cd "$(dirname "$0")"

if ! python3 -c "import PIL" >/dev/null 2>&1; then
  echo "Installing Pillow..."
  python3 -m pip install -r requirements.txt
fi

python3 server.py &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM
sleep 1
open "http://127.0.0.1:${PORT:-4173}"
wait "$SERVER_PID"
