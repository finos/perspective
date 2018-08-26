build: ## build the package
	python3 setup.py build

builddebug: buildd  ## build the package

buildd: ## build the package
	PSP_DEBUG=True python3 setup.py build

buildjs: ## build the package with emscripten
	../emsdk/emsdk activate latest
	bash "source ../emsdk/emsdk_env.sh && use_ems=True python3 setup.py build"

buildext: ## build the package extensions
	python3 setup.py build_ext

buildip: build  ## build the package extensions
	cp -r build/`ls build | grep lib`/perspective/*.so ./perspective

buildipd: buildd  ## build the package extensions
	cp -r build/`ls build | grep lib`/perspective/*.so ./perspective

tests: ## Clean and Make unit tests
	python3 -m nose -v ./build/`ls ./build | grep lib`/perspective/tests --with-coverage --cover-erase --cover-package=`find perspective -name "*.py" | sed "s=\./==g" | sed "s=/=.=g" | sed "s/.py//g" | tr '\n' ',' | rev | cut -c2- | rev`
	
test: clean build buildip ## run the tests for travis CI
	@ python3 -m nose -v ./build/`ls ./build | grep lib`/perspective/tests --with-coverage --cover-erase --cover-package=`find perspective -name "*.py" | sed "s=\./==g" | sed "s=/=.=g" | sed "s/.py//g" | tr '\n' ',' | rev | cut -c2- | rev`

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

labextension: install ## enable labextension
	jupyter labextension install @jpmorganchase/perspective-jupyterlab

install:  ## install to site-packages
	python3 setup.py install

preinstall:  ## install dependencies
	python3 -m pip install -r requirements.txt

docs:  ## make documentation
	make -C ./docs html

dist:  ## dist to pypi
	python3 setup.py sdist upload -r pypi

# Thanks to Francoise at marmelab.com for this
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo '$*=$($*)'

.PHONY: clean test tests help annotate annotate_l docs dist build buildext buildjs buildip buildd builddebug buildipd
