# Installation

`perspective-python` contains full bindings to the Perspective API, a JupyterLab
widget, and WebSocket handlers for several webserver libraries that allow you to
host Perspective using server-side Python.

## PyPI

`perspective-python` can be installed from [PyPI](https://pypi.org) via `pip`:

```bash
pip install perspective-python
```

That's it! If JupyterLab is installed in this Python environment, you'll also
get the `perspective.widget.PerspectiveWidget` class when you import
`perspective` in a Jupyter Lab kernel.

<!--
### Anaconda

`perspective-python` can also be installed for [Anaconda](https://anaconda.org/)
via [Conda Forge](https://conda-forge.org)

```bash
conda install -c conda-forge perspective
``` -->
