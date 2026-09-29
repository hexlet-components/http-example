IMAGE_ID := ghcr.io/hexlet-components/http-example
PORT ?= 8080

setup:
	pnpm install --frozen-lockfile
	make compile

# Типы обработчиков из спецификации. Сгенерированное лежит в репозитории, а не
# собирается на старте: образ не должен тянуть генератор, а свежесть проверяет
# `make check-generated` в прогоне.
generate:
	pnpm exec openapi-ts

check-generated:
	pnpm exec openapi-ts
	git diff --exit-code custom-server/src/generated

compile:
	pnpm exec tsp compile ./typespec/http-api/main.tsp --output-dir "./tsp-output/http-api"
	pnpm exec tsp compile ./typespec/postman/main.tsp --output-dir "./tsp-output/postman"
	pnpm exec tsp compile ./typespec/http-protocol/main.tsp --output-dir "./tsp-output/http-protocol"
	pnpm exec tsp compile ./typespec/js-playwright/main.tsp --output-dir "./tsp-output/js-playwright"

start:
	./bin/start.sh

test:
	make check-generated
	node ./bin/smoke-test.js

update-deps:
	pnpm exec ncu -u

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
