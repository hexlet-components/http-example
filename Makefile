IMAGE_ID := ghcr.io/hexlet-components/rest-api-example

setup:
	npm ci
	make compile

compile:
	npx tsp compile ./typespec/http-api/main.tsp --output-dir "./tsp-output/http-api"
	npx tsp compile ./typespec/postman/main.tsp --output-dir "./tsp-output/postman"
	npx tsp compile ./typespec/http-protocol/main.tsp --output-dir "./tsp-output/http-protocol"
	npx tsp compile ./typespec/js-playwright/main.tsp --output-dir "./tsp-output/js-playwright"

dev:
	docker run -v ./custom-server:/custom-server -p 8080:8080 $(IMAGE_ID)

start:
	prism mock -m -p 4011 --host 0.0.0.0 ./tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml &
	prism mock -m -p 4012 --host 0.0.0.0 ./tsp-output/http-protocol/@typespec/openapi3/openapi.1.0.yaml &
	prism mock -m -p 4013 --host 0.0.0.0 ./tsp-output/js-playwright/@typespec/openapi3/openapi.1.0.yaml &
	prism mock -m -p 4014 --host 0.0.0.0 ./tsp-output/postman/@typespec/openapi3/openapi.1.0.yaml &
	npm start &
	caddy run

test:
	echo no tests

docker-build:
	docker build . -t $(IMAGE_ID)

docker-run:
	docker rm -f rest-api-example
	docker run -p 8080:8080 --name rest-api-example $(IMAGE_ID)

docker-sh:
	docker run -it --entrypoint sh $(IMAGE_ID)
