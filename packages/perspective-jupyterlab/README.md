# Perspective JupyterLab Extension

This extension allows in-lining perspective based charts in jupyterlab notebooks.

[Examples](https://github.com/finos/perspective/tree/master/examples/jupyter-notebooks)

## Installation

### From npm

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension install @finos/perspective-jupyterlab
```

### PIP

```bash
pip install perspective-python
```

## Cheat sheet

### frontend development

```
# from the project root:
# Focus JS, perspective-viewer (if necessary), perspective-jupyterlab, then build
yarn setup
yarn build
# Focus Python project, build it
yarn setup
yarn build

# Set up a jupyter lab (>=3.6) environment.  This is out of scope.
jupyter lab &
# jlab_link installs the python extension (including the frontend changes) to a place
# where jupyterlab will find it
yarn run jlab_link
# verify @finos/perspective is installed
jupyter labextension list

# To iterate:
# Focus JS, perspective-jupyterlab (and/or anything else you're rebuilding)
yarn setup
# build frontend
yarn build
# install to jupyter
yarn run jlab_link

```
