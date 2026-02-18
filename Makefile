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

dev:
	docker rm -f http-example
	docker run -e PORT=$(PORT) -v ./custom-server:/custom-server -p $(PORT):$(PORT) --name http-example $(IMAGE_ID)

start:
	npx prism mock -m -d --json-schema-faker-fillProperties=false -p 4011 --host 0.0.0.0 ./tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml &
	npx prism mock -m -d --json-schema-faker-fillProperties=false -p 4012 --host 0.0.0.0 ./tsp-output/http-protocol/@typespec/openapi3/openapi.1.0.yaml &
	npx prism mock -m -d --json-schema-faker-fillProperties=false -p 4013 --host 0.0.0.0 ./tsp-output/js-playwright/@typespec/openapi3/openapi.1.0.yaml &
	npx prism mock -m -d --json-schema-faker-fillProperties=false -p 4014 --host 0.0.0.0 ./tsp-output/postman/@typespec/openapi3/openapi.1.0.yaml &
	npm start &
	caddy run

test:
	echo no tests

docker-build:
	docker build . -t $(IMAGE_ID)

docker-run:
	docker rm -f http-example
	docker run -e PORT=$(PORT) -p $(PORT):$(PORT) --name http-example $(IMAGE_ID)

docker-sh:
	docker run -e PORT=$(PORT) -it --entrypoint sh $(IMAGE_ID)

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

update-deps:
	npx ncu -u
