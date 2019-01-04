build: ## build the package
	cd .. && python3 setup.py build

inplace: ## copy things inplace
	cp `find ../build -name "libbinding.so"` perspective/table/
	cp `find ../build -name "libpsp.so"` perspective/table/

tests: inplace ## Clean and Make unit tests
	python3 -m nose2 -v perspective --with-coverage --coverage=perspective

test: inplace lint ## run the tests for travis CI
	@ python3 -m nose2 -v perspective --with-coverage --coverage=perspective

lint: ## run linter
	pylint perspective || echo
	flake8 perspective 

annotate: ## MyPy type annotation check
	mypy -s perspective

annotate_l: ## MyPy type annotation check - count only
	mypy -s perspective | wc -l 

clean: ## clean the repository
	find . -name "__pycache__" | xargs  rm -rf 
	find . -name "*.pyc" | xargs rm -rf 
	find . -name ".ipynb_checkpoints" | xargs  rm -rf 
	rm -rf .coverage cover htmlcov logs build dist *.egg-info
	make -C ./docs clean
	find . -name "*.so"  | xargs rm -rf
	find . -name "*.a"  | xargs rm -rf

install:  ## install to site-packages
	python3 -m pip install ..

preinstall:  ## install dependencies
	python3 -m pip install -r requirements.txt

docs:  ## make documentation
	make -C ./docs html

dist:  ## dist to pypi
	python3 ../setup.py sdist upload -r pypi

# Thanks to Francoise at marmelab.com for this
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo '$*=$($*)'

.PHONY: clean test tests help annotate annotate_l docs dist build inplace
