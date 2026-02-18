IMAGE_ID := ghcr.io/hexlet-components/http-example
PORT := 8080

setup:
	npm ci
	make compile

compile:
	npx tsp compile ./typespec/http-api/main.tsp --output-dir "./tsp-output/http-api"
	npx tsp compile ./typespec/postman/main.tsp --output-dir "./tsp-output/postman"
	npx tsp compile ./typespec/http-protocol/main.tsp --output-dir "./tsp-output/http-protocol"
	npx tsp compile ./typespec/js-playwright/main.tsp --output-dir "./tsp-output/js-playwright"

start:
	./bin/start.sh

test:
	echo no tests

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
