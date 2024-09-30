setup:
	npm ci
	make compile

compile:
	npx tsp compile ./typescpec/main.tsp
	# node typescpec/postProcessing.mjs

dev:
	node --watch server/bin/index.mjs

start:
	node server/bin/index.mjs

test:
	echo no tests

compose-test:
	docker compose up --build --abort-on-container-exit
