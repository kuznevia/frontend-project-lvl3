install: # install npm
	npm ci

publish: #publish rss-reader
	npm publish --dry-run
	
lint:#initializing linter
	npx eslint .

lintfix:#fixing linter
	npx eslint . --fix

develop:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test