# perspective-python

Python APIs for [perspective](https://github.com/finos/perspective) front end

[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=flat-square)](https://www.npmjs.com/package/@finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg?style=flat-square)](https://pypi.python.org/pypi/perspective-python)
[![Build Status](https://dev.azure.com/finosfoundation/perspective/_apis/build/status/finos.perspective?branchName=master)](https://dev.azure.com/finosfoundation/perspective/_build/latest?definitionId=1&branchName=master)
[![FINOS - Active](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-active.svg)](https://finosfoundation.atlassian.net/wiki/display/FINOS/Active)
[![Binder](http://mybinder.org/badge_logo.svg)](http://beta.mybinder.org/v2/gh/finos/perspective/master?urlpath=lab/tree/examples/jupyter-notebooks)

Perspective is an <i>interactive</i> visualization component for <i>large</i>, <i>real-time</i>
datasets. Originally developed for J.P. Morgan's trading business,  Perspective
makes it simple to build real-time & user configurable analytics entirely in the
browser, or in concert with Python and/or
[Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/).
Use it to create reports, dashboards, notebooks and applications, with static
data or streaming updates via [Apache Arrow](https://arrow.apache.org/).

<img src="https://perspective.finos.org/img/demo_small.gif">

## Features

- A fast, memory efficient streaming query engine, written in C++ and compiled to [WebAssembly](https://webassembly.org/), with read/write/stream support for [Apache Arrow](https://arrow.apache.org/).

- A framework-agnostic query configuration UI component, based on [Web Components](https://www.webcomponents.org/), and a WebWorker and/or WebSocket data engine host for stable interactivity at high frequency.

- A customizable HTML Data Grid plugin, and a Chart plugin built on [D3FC](https://d3fc.io/).

- Integration with [Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/), both natively in a Python kernel, and as a notebook Widget.

- Cross-language streaming and/or virtualization to the browser via [Apache Arrow](https://arrow.apache.org/).

- Runtimes for the browser, Python, and Node.js.

## Documentation

* [Project Site](https://perspective.finos.org/)
* [Python Installation and User Guide](https://perspective.finos.org/docs/md/python.html)
* [Table (Conceptual Overview)](https://perspective.finos.org/docs/md/table.html)
* [View (Conceptual Overview)](https://perspective.finos.org/docs/md/view.html)
* [Data Binding](https://perspective.finos.org/docs/md/table.html)
* [Developer's Guide](https://perspective.finos.org/docs/md/development.html)
* [Perspective Python API](https://perspective.finos.org/docs/obj/perspective-python.html)