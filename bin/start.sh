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

# У спецификации http-api мока нет: все её маршруты обслуживает приложение, см.
# custom-server/src/resources.js. Мок отдаёт ответ, не разбирая запрос, а уроки
# курса построены на skip, limit, select и на идентификаторе в пути.
# Остальные три спецификации остаются на -d осознанно: примеров в них нет, и
# статичный режим отдал бы вместо данных заглушки вида "string".
start_service prism-http-protocol "npx prism mock --multiprocess=false -d --json-schema-faker-fillProperties=false -p 4012 --host 0.0.0.0 ./tsp-output/http-protocol/@typespec/openapi3/openapi.1.0.yaml"
start_service prism-js-playwright "npx prism mock --multiprocess=false -d --json-schema-faker-fillProperties=false -p 4013 --host 0.0.0.0 ./tsp-output/js-playwright/@typespec/openapi3/openapi.1.0.yaml"
start_service prism-postman "npx prism mock --multiprocess=false -d --json-schema-faker-fillProperties=false -p 4014 --host 0.0.0.0 ./tsp-output/postman/@typespec/openapi3/openapi.1.0.yaml"
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
