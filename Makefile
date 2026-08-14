IMAGE_ID := ghcr.io/hexlet-components/http-example
PORT ?= 8080

setup:
	npm ci
	make compile

# Типы обработчиков из спецификации. Сгенерированное лежит в репозитории, а не
# собирается на старте: образ не должен тянуть генератор, а свежесть проверяет
# `make check-generated` в прогоне.
generate:
	npx @hey-api/openapi-ts

check-generated:
	npx @hey-api/openapi-ts
	git diff --exit-code custom-server/src/generated

compile:
	npx tsp compile ./typespec/http-api/main.tsp --output-dir "./tsp-output/http-api"
	npx tsp compile ./typespec/postman/main.tsp --output-dir "./tsp-output/postman"
	npx tsp compile ./typespec/http-protocol/main.tsp --output-dir "./tsp-output/http-protocol"
	npx tsp compile ./typespec/js-playwright/main.tsp --output-dir "./tsp-output/js-playwright"

start:
	./bin/start.sh

test:
	make check-generated
	node ./bin/smoke-test.js

update-deps:
	npx ncu -u

compose-build:
	docker compose build

compose-bash:
	docker compose run --rm app sh

compose-setup:
	docker compose run --rm app setup

compose:
	docker compose up

compose-down:
	docker compose down

compose-logs:
	docker compose logs -f --tail=200

compose-ps:
	docker compose ps
