compile:
	npx tsp compile ./typescpec/main.tsp

dev:
	npx tsp compile . --watch

start:
	npx prism mock tsp-output/@typespec/openapi3/openapi.yaml
