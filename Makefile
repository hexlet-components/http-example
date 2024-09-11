compile:
	npx tsp compile ./typescpec/main.tsp

dev:
	npx tsp compile ./typescpec/main.tsp --watch

start:
	node --watch server/bin/index.js
