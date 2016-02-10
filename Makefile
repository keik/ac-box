all: clean test dist/ac-box.js dist/ac-box.min.js lint

watch:
	@make -j run-dev-server

dist/ac-box.min.js: node_modules dist/ac-box.js
	@node_modules/.bin/uglifyjs dist/ac-box.js -cm --comments -o $@

dist/ac-box.js: node_modules src/ac-box.js dist
	@perl -i -pe 's/(\* \@version ).*$$/\1$(shell node -e 'console.log("v" + require("./package.json").version)')/' src/ac-box.js
	@node_modules/.bin/browserify -t undebuggify src/ac-box.js -s AcBox -o $@

test: node_modules
	@node_modules/.bin/tape -r babel-register test/test.js

lint: node_modules
	@node_modules/.bin/eslint src/**/*.js

dist:
	@mkdir -p dist

clean:
	@rm -rf dist

run-dev-server: node_modules
	@node_modules/.bin/budo src/ac-box.js:dist/ac-box.js -- -s AcBox

node_modules: package.json
	@npm i

.PHONY: all watch test lint clean run-dev-server
