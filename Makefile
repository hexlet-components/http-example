setup:
	npm ci
	make compile

compile:
	npx tsp compile ./typescpec/main.tsp

dev:
	node --watch server/bin/index.js

start:
	node server/bin/index.js
