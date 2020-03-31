# [![Perspective](https://perspective.finos.org/img/logo_inverted_tiny.png)](https://perspective.finos.org/)

[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=flat-square)](https://www.npmjs.com/package/@finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![Build Status](https://dev.azure.com/finosfoundation/perspective/_apis/build/status/finos.perspective?branchName=master)](https://dev.azure.com/finosfoundation/perspective/_build/latest?definitionId=1&branchName=master)
[![FINOS - Active](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-active.svg)](https://finosfoundation.atlassian.net/wiki/display/FINOS/Active)

Perspective is an <i>interactive</i> visualization component for <i>large</i>, <i>real-time</i>
datasets. Originally developed for J.P. Morgan's trading business,  Perspective
makes it simple to build real-time & user configurable analytics entirely in the
browser, or in concert with Python and/or
[Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/).
Use it to create reports, dashboards, notebooks and applications, with static
data or streaming updates via [Apache Arrow](https://arrow.apache.org/).

<img src="https://perspective.finos.org/img/demo_small.gif">

## Features

- A fast, memory efficient streaming query engine, written in C++ and compiled to [WebAssembly](https://webassembly.org/), with read/write/stream support for [Apache Arrow]().

- A framework-agnostic query configuration UI component, based on [Web Components](https://www.webcomponents.org/), and a WebWorker and/or WebSocket data engine host for stable interactivity at high frequency.

- A customizable HTML Data Grid plugin, and a Chart plugin built on [D3FC](https://d3fc.io/).

- Integration with [Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/), both natively in a Python kernel, and as a notebook Widget.

- Cross-language streaming and/or virtualization to the browser via [Apache Arrow](https://arrow.apache.org/).

- Runtimes for the browser, Python, and Node.js.

## Examples
||||
|:--|:--|:--|
|Superstore|Olympics|Custom Styles|
|[![Superstore](https://bl.ocks.org/texodus/raw/803de90736a3641ad91c5c7a1b49d0a7/thumbnail.png)](https://bl.ocks.org/texodus/803de90736a3641ad91c5c7a1b49d0a7)|[![Olympics](http://bl.ocks.org/texodus/raw/efd4a857aca9a52ab6cddbb6e1f701c9/c6c0fb7611ca742830e05cce667678c25b6f288a/thumbnail.png)](https://bl.ocks.org/texodus/efd4a857aca9a52ab6cddbb6e1f701c9)|[![Custom Styles](http://bl.ocks.org/texodus/raw/c42f3189699bd29cf20bbe7dce767b07/62d75a47e049602312ba2597bfd37eb032b156f0/thumbnail.png)](http://bl.ocks.org/texodus/c42f3189699bd29cf20bbe7dce767b07)|
|Editable|Streaming|CSV|
|[![Editable](https://bl.ocks.org/texodus/raw/45b868833c9f456bd39a51e606412c5d/e590d237a5237790694946018680719c9fef56cb/thumbnail.png)](https://bl.ocks.org/texodus/45b868833c9f456bd39a51e606412c5d)|[![Streaming](https://bl.ocks.org/texodus/raw/9bec2f8041471bafc2c56db2272a9381/c69c2cfacb23015f3aaeab3555a0035702ffdb1c/thumbnail.png)](https://bl.ocks.org/texodus/9bec2f8041471bafc2c56db2272a9381)|[![CSV](https://bl.ocks.org/texodus/raw/02d8fd10aef21b19d6165cf92e43e668/5e78be024893aa651fcdfac816841d54777ccdec/thumbnail.png)](https://bl.ocks.org/texodus/02d8fd10aef21b19d6165cf92e43e668)|
|IEX Cloud|NYC Citibike||
|[![IEX Cloud](https://bl.ocks.org/texodus/raw/eb151fdd9f98bde987538cbc20e003f6/79d409006f50b24f1607758945144b392e4921a2/thumbnail.png)](https://bl.ocks.org/texodus/eb151fdd9f98bde987538cbc20e003f6)|[![NYC Citibike](https://bl.ocks.org/texodus/raw/bc8d7e6f72e09c9dbd7424b4332cacad/f704ce53a3f453f8fe66bd9ff4ead831786384ea/thumbnail.png)](https://bl.ocks.org/texodus/bc8d7e6f72e09c9dbd7424b4332cacad)||



## Documentation

* [Project Site](https://perspective.finos.org/)
* [Installation](https://perspective.finos.org/docs/md/installation.html)
* [Javascript User's Guide](https://perspective.finos.org/docs/md/js.html)
* [Python User's Guide](https://perspective.finos.org/docs/md/python.html)
* [Developer's Guide](https://perspective.finos.org/docs/md/development.html)
* [Conceptual Overview](https://perspective.finos.org/docs/md/concepts.html)
* [Perspective API](https://github.com/finos/perspective/blob/master/packages/perspective/README.md)
* [Perspective Viewer API](https://github.com/finos/perspective/blob/master/packages/perspective-viewer/README.md)
* [Perspective Python API](https://perspective.finos.org/docs/obj/perspective-python.html)