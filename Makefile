install: # install npm
	npm ci

publish: #publish rss-reader
	npm publish --dry-run
	
lint:#initializing linter
	npx eslint .

lintfix:#fixing linter
	npx eslint . --fix