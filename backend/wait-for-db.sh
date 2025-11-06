#!/usr/bin/env sh
set -e
HOST="$1"; PORT="${2:-5432}"
echo "Waiting for $HOST:$PORT ..."
python3 - <<'PY' "$HOST" "$PORT"
import socket, sys, time
host, port = sys.argv[1], int(sys.argv[2])
while True:
    try:
        with socket.create_connection((host, port), timeout=1):
            break
    except OSError:
        time.sleep(0.5)
print("DB is up")
PY
echo "Database is up. Continuing..."
exit 0
