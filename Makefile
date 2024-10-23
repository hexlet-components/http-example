setup:
	npm ci
	make compile

compile:
	npx tsp compile ./typespec/http-api/main.tsp --output-dir "./tsp-output/http-api"
	npx tsp compile ./typespec/postman/main.tsp --output-dir "./tsp-output/postman"
	npx tsp compile ./typespec/http-protocol/main.tsp --output-dir "./tsp-output/http-protocol"
	npx tsp compile ./typespec/js-playwright/main.tsp --output-dir "./tsp-output/js-playwright"

dev:
	npx fastify start -a 0.0.0.0 server/src/index.js

start:
	prism mock -m -p 4011 --host 0.0.0.0 ./tsp-output/http-api/@typespec/openapi3/openapi.1.0.yaml &
	prism mock -m -p 4012 --host 0.0.0.0 ./tsp-output/http-protocol/@typespec/openapi3/openapi.1.0.yaml &
	prism mock -m -p 4013 --host 0.0.0.0 ./tsp-output/js-playwright/@typespec/openapi3/openapi.1.0.yaml &
	prism mock -m -p 4014 --host 0.0.0.0 ./tsp-output/postman/@typespec/openapi3/openapi.1.0.yaml &
	npm start &
	caddy run &

test:
	echo no tests

compose-test:
	docker compose up --build --abort-on-container-exit

generate-fixtures:
	node server/bin/generateFixtures.js
