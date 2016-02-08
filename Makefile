all: clean test dist/autocombo.js dist/autocombo.min.js lint

watch:
	@make -j run-dev-server

dist/autocombo.min.js: node_modules dist/autocombo.js
	@node_modules/.bin/uglifyjs dist/autocombo.js -cm --comments -o $@

dist/autocombo.js: node_modules src/autocombo.js dist
	@perl -i -pe 's/(\* \@version ).*$$/\1$(shell node -e 'console.log("v" + require("./package.json").version)')/' src/autocombo.js
	@node_modules/.bin/browserify src/autocombo.js -s AutoCombo -o $@

test: node_modules
	@node_modules/.bin/tape -r babel-register test/test.js

lint: node_modules
	@node_modules/.bin/eslint src/**/*.js

dist:
	@mkdir -p dist

clean:
	@rm -rf dist

run-dev-server: node_modules
	@node_modules/.bin/budo src/autocombo.js:dist/autocombo.js -- -s AutoCombo

node_modules: package.json
	@npm i

.PHONY: all watch test lint clean run-dev-server
