#!/bin/sh
set -eu

services=""

start_service() {
  name="$1"
  shift
  sh -c "$*" &
  pid=$!
  services="$services $name:$pid"
  echo "Started $name (pid $pid)"
}

stop_all() {
  echo "Stopping all services..."
  for svc in $services; do
    pid="${svc#*:}"
    kill "$pid" 2>/dev/null || true
  done
  wait || true
}

trap 'stop_all' INT TERM

# Моков prism больше нет ни у одной спецификации: все четыре обслуживает
# приложение, маршруты строятся по самой спецификации. Мок отдавал ответ, не
# разбирая запрос, а уроки построены на skip, limit, select и на идентификаторе
# в пути.
start_service app "npm start"
start_service caddy "caddy run"

while :; do
  for svc in $services; do
    name="${svc%%:*}"
    pid="${svc#*:}"
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid" || true
      echo "$name exited. Shutting down."
      stop_all
      exit 1
    fi
  done
  sleep 1
done
