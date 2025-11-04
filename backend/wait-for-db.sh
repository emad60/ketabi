#!/usr/bin/env bash
# backend/wait-for-db.sh
set -e

host="$1"
port="${2:-5432}"

echo "Waiting for database $host:$port..."
until nc -z "$host" "$port"; do
  sleep 1
done

echo "Database is up!"
exec "${@:3}"