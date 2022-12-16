![Perspective](https://github.com/finos/perspective/blob/master/docs/static/img/logo/logo-light.png?raw=true#gh-light-mode-only)
![Perspective](https://github.com/finos/perspective/blob/master/docs/static/img/logo/logo-dark.png?raw=true#gh-dark-mode-only)

[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=flat)](https://www.npmjs.com/package/@finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg?style=flat)](https://pypi.python.org/pypi/perspective-python)
[![Build Status](https://github.com/finos/perspective/actions/workflows/build.yml/badge.svg?branch=master&event=push)](https://github.com/finos/perspective/actions/workflows/build.yml)

Perspective is an <i>interactive</i> analytics and data visualization component,
which is especially well-suited for <i>large</i> and/or <i>streaming</i>
datasets. Use it to create user-configurable reports, dashboards, notebooks and
applications, then deploy stand-alone in the browser, or in concert with Python
and/or [Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/).

### Features

-   A fast, memory efficient streaming query engine, written in
    C++ and compiled for both [WebAssembly](https://webassembly.org/) and
    [Python](https://www.python.org/), with read/write/streaming for
    [Apache Arrow](https://arrow.apache.org/), and a high-performance columnar
    expression language based on [ExprTK](https://github.com/ArashPartow/exprtk).

-   A framework-agnostic User Interface packaged as a
    [Custom Element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements),
    powered either in-browser via WebAssembly or virtually via
    WebSocket server (Python/Node).

-   A [JupyterLab](https://jupyter.org/) widget and Python client library, for
    interactive data analysis in a notebook, as well as _scalable_ production
    [Voila](https://github.com/voila-dashboards/voila) applications.

<br/>
<img width="770" src="https://github.com/finos/perspective/blob/gh-pages/img/demo_large.gif?raw=true">

## Examples

<!-- Examples -->
<table><tbody><tr><td>magic</td><td>nft</td><td>nypd ccrb</td></tr><tr><td><a href="https://texodus.github.io/mtg-perspective/?seasons-in-the-abyss-67"><img src="https://perspective.finos.org/img/mtg_preview.png"></img></a></td><td><a href="https://sc1f.github.io/pudgy-penguin-perspective/"><img src="https://raw.githubusercontent.com/sc1f/pudgy-penguin-perspective/pages/meta.png"></img></a></td><td><a href="https://texodus.github.io/nypd-ccrb/"><img src="https://texodus.github.io/nypd-ccrb/preview.png"></img></a></td></tr><tr><td>jupyterlab</td><td>fractal</td><td>raycasting</td></tr><tr><td><a href="http://beta.mybinder.org/v2/gh/finos/perspective/master?urlpath=lab/tree/examples/jupyter-notebooks"><img src="https://perspective.finos.org/img/jupyterlab.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=fractal"><img src="https://perspective.finos.org/blocks/fractal/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=raycasting"><img src="https://perspective.finos.org/blocks/raycasting/preview.png"></img></a></td></tr><tr><td>evictions</td><td>covid</td><td>movies</td></tr><tr><td><a href="https://perspective.finos.org/block?example=evictions"><img src="https://perspective.finos.org/blocks/evictions/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=covid"><img src="https://perspective.finos.org/blocks/covid/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=movies"><img src="https://perspective.finos.org/blocks/movies/preview.png"></img></a></td></tr><tr><td>superstore</td><td>olympics</td><td>editable</td></tr><tr><td><a href="https://perspective.finos.org/block?example=superstore"><img src="https://perspective.finos.org/blocks/superstore/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=olympics"><img src="https://perspective.finos.org/blocks/olympics/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=editable"><img src="https://perspective.finos.org/blocks/editable/preview.png"></img></a></td></tr><tr><td>streaming</td><td>csv</td><td>custom</td></tr><tr><td><a href="https://perspective.finos.org/block?example=streaming"><img src="https://perspective.finos.org/blocks/streaming/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=csv"><img src="https://perspective.finos.org/blocks/csv/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=custom"><img src="https://perspective.finos.org/blocks/custom/preview.png"></img></a></td></tr><tr><td>iex</td><td>citibike</td></tr><tr><td><a href="https://perspective.finos.org/block?example=iex"><img src="https://perspective.finos.org/blocks/iex/preview.png"></img></a></td><td><a href="https://perspective.finos.org/block?example=citibike"><img src="https://perspective.finos.org/blocks/citibike/preview.png"></img></a></td></tr></tbody></table>
<!-- Examples -->






## Documentation

* [Project Site](https://perspective.finos.org/)
* [Table](https://perspective.finos.org/docs/table.html)
* [View](https://perspective.finos.org/docs/view.html)
* [Javascript User Guide](https://perspective.finos.org/docs/js.html)
* [Python User Guide](https://perspective.finos.org/docs/python.html)
* [Data Binding](https://perspective.finos.org/docs/table.html)
* [Developer Guide](https://perspective.finos.org/docs/development.html)
* [Perspective API](https://github.com/finos/perspective/blob/master/packages/perspective/README.md)
* [Perspective Viewer API](https://github.com/finos/perspective/blob/master/packages/perspective-viewer/README.md)
* [Perspective Python API](https://perspective.finos.org/docs/obj/perspective-python.html)

## Community

* [`perspective-viewer-maps` OpenLayers/OpenStreetMap plugin](https://github.com/DevAndyLee/perspective-viewer-maps)
* [Scott Logic / Perspective Plugin API - How to build a new plugin](https://blog.scottlogic.com/2019/04/23/perspective-plugin-api-how-to-build-a-new-plugin.html)
* [Streaming, cross-sectional data visualization in Jupyterlab | Junyuan Tan, JupyterCon 2020](http://www.youtube.com/watch?v=IO-HJsGdleE)

