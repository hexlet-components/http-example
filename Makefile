setup:
	npm ci
	make compile

compile:
	npx tsp compile ./typescpec/main.tsp
	node typescpec/postProcessing.js

dev:
	node --watch server/bin/index.js

start:
	node server/bin/index.js

test:
	npm test
