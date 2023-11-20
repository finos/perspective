<br />
<a href="https://github.com/finos/perspective/blob/master/docs/static/svg/perspective-logo-light.svg?raw=true#gh-light-mode-only"><img src="https://github.com/finos/perspective/raw/master/docs/static/svg/perspective-logo-light.svg?raw=true#gh-light-mode-only" alt="Perspective" width="260"></a>
<a href="https://github.com/finos/perspective/blob/master/docs/static/svg/perspective-logo-dark.svg?raw=true#gh-dark-mode-only"><img src="https://github.com/finos/perspective/raw/master/docs/static/svg/perspective-logo-dark.svg?raw=true#gh-dark-mode-only" alt="Perspective" width="260"></a>
<br/><br/>

[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=flat)](https://www.npmjs.com/package/@finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg?style=flat)](https://pypi.python.org/pypi/perspective-python)
[![Build Status](https://github.com/finos/perspective/actions/workflows/build.yml/badge.svg?branch=master&event=push)](https://github.com/finos/perspective/actions/workflows/build.yml)

<br/>

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

### Examples

<!-- Examples -->
<table><tbody><tr><td>editable</td><td>file</td><td>fractal</td></tr><tr><td><a href="https://perspective.finos.org/block?example=editable"><img height="125" src="https://perspective.finos.org/blocks/editable/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=file"><img height="125" src="https://perspective.finos.org/blocks/file/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=fractal"><img height="125" src="https://perspective.finos.org/blocks/fractal/preview.png?"></img></a></td></tr><tr><td>market</td><td>raycasting</td><td>evictions</td></tr><tr><td><a href="https://perspective.finos.org/block?example=market"><img height="125" src="https://perspective.finos.org/blocks/market/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=raycasting"><img height="125" src="https://perspective.finos.org/blocks/raycasting/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=evictions"><img height="125" src="https://perspective.finos.org/blocks/evictions/preview.png?"></img></a></td></tr><tr><td>nypd</td><td>magic</td><td>streaming</td></tr><tr><td><a href="https://perspective.finos.org/block?example=nypd"><img height="125" src="https://perspective.finos.org/blocks/nypd/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=magic"><img height="125" src="https://perspective.finos.org/blocks/magic/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=streaming"><img height="125" src="https://perspective.finos.org/blocks/streaming/preview.png?"></img></a></td></tr><tr><td>covid</td><td>webcam</td><td>movies</td></tr><tr><td><a href="https://perspective.finos.org/block?example=covid"><img height="125" src="https://perspective.finos.org/blocks/covid/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=webcam"><img height="125" src="https://perspective.finos.org/blocks/webcam/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=movies"><img height="125" src="https://perspective.finos.org/blocks/movies/preview.png?"></img></a></td></tr><tr><td>superstore</td><td>citibike</td><td>olympics</td></tr><tr><td><a href="https://perspective.finos.org/block?example=superstore"><img height="125" src="https://perspective.finos.org/blocks/superstore/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=citibike"><img height="125" src="https://perspective.finos.org/blocks/citibike/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=olympics"><img height="125" src="https://perspective.finos.org/blocks/olympics/preview.png?"></img></a></td></tr><tr><td>jupyterlab</td></tr><tr><td><a href="http://beta.mybinder.org/v2/gh/finos/perspective/master?urlpath=lab/tree/examples/jupyter-notebooks"><img height="125" src="https://perspective.finos.org/img/jupyterlab.png?"></img></a></td></tr></tbody></table>
<!-- Examples -->

### Documentation

-   [Project Site](https://perspective.finos.org/)
-   User Guides
    -   [Javascript User Guide](https://perspective.finos.org/docs/js.html)
    -   [Python User Guide](https://perspective.finos.org/docs/python.html)
    -   [Developer Guide](https://perspective.finos.org/docs/development.html)
-   Concepts
    -   [Table](https://perspective.finos.org/docs/table.html)
    -   [View](https://perspective.finos.org/docs/view.html)
    -   [Expression Columns](https://perspective.finos.org/docs/expressions.html)
    -   [Data Binding](https://perspective.finos.org/docs/table.html)
-   API
    -   [Perspective API](https://github.com/finos/perspective/blob/master/packages/perspective/README.md)
    -   [Perspective Viewer API](https://perspective.finos.org/docs/obj/perspective-viewer/)
    -   [Perspective Python API](https://perspective.finos.org/docs/obj/perspective-python.html)

### Community / Media

-   [Streaming, cross-sectional data visualization in JupyterLab | Junyuan Tan, JupyterCon 2020](http://www.youtube.com/watch?v=IO-HJsGdleE)
-   [Perspective in 3D | Andrew Stein, Open Source in Finance Forum NYC 2022](https://www.youtube.com/watch?v=0ut-ynvBpGI)
-   [Build an order book simulation with Perspective | Andrew Stein, FINOS Open Source in Fintech Meetup 2021](https://www.youtube.com/watch?v=no0qChjvdgQ)
-   [Perspective project case study | FINOS](https://www.finos.org/hubfs/FINOS/assets/FINOS%20Perspective%20Case%20Study.pdf)
