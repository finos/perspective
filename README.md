# [![Perspective](https://perspective.finos.org/img/logo_inverted_tiny.png)](https://perspective.finos.org/)

[![Build Status](https://travis-ci.org/finos/perspective.svg?branch=master)](https://travis-ci.org/finos/perspective)
[![Appveyor](https://ci.appveyor.com/api/projects/status/github/finos/perspective?svg=true)](https://ci.appveyor.com/project/neilslinger/perspective)
[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=flat-square)](https://www.npmjs.com/package/@finos/perspective)
[![FINOS - Operating](https://cdn.rawgit.com/finos/contrib-toolbox/master/images/badge-operating.svg)](https://finosfoundation.atlassian.net/wiki/display/FINOS/Operating)


A streaming data visualization engine for Javascript, Perspective makes it
simple to build real-time & user configurable analytics entirely in the browser.

<img src="https://perspective.finos.org/img/demo_small.gif">

## Features

- A fast, memory efficient streaming pivot engine written principally in C++ and
  compiled to WebAssembly via the
  [emscripten](https://github.com/kripken/emscripten) compiler.

- An embeddable, framework-agnostic configuration UI, based
  on [Web Components](https://www.webcomponents.org/), and a WebWorker engine
  host for responsiveness at high frequency.

- A suite of simple visualization plugins for some common Javascript libraries such as
  [d3fc](https://d3fc.io/) and [Hypergrid](https://github.com/fin-hypergrid/core).

- Integration with [Jupyterlab](https://github.com/finos/perspective/tree/master/packages/perspective-jupyterlab).

- Runtimes for the Browser, Python, and Node.js.

## Examples
|||
|:--|:--|
|[Superstore](https://bl.ocks.org/texodus/372d406997d5522ebaafb17f0f521d97)| A static `superstore.arrow` demo.|
|[Linked Superstore](https://bl.ocks.org/texodus/08fb5f1afccbd33e333453dc70db88ea)| An example of `<perspective-viewer>`s linked through click events.|
|[Dataset Explorer](https://bl.ocks.org/texodus/ecb5d086e0c9d52e414d2de6c93b5db3)| A configurable dataset performance tester. |
|[Fractal](https://bl.ocks.org/texodus/1ce655d6bc0cc0d9db852d562af3e487)| `<perspective-viewer>` fractal playground.|
|[Olympics](https://bl.ocks.org/texodus/6d4fa16fff331d71ac58ad256f0c5f94)| An example of sharing a single `perspective.table` among multiple `<perspective-viewer>`s.|
|[Olympics Workspace](https://bl.ocks.org/zemeolotu/68f3f1c2535bdde1a296b90e9b434717)| An example of Perspective Workspace with multiple perspective widgets sharing the same table with one directional cross-filtering|
|[Streaming](https://bl.ocks.org/texodus/9bec2f8041471bafc2c56db2272a9381)| A streaming random data demo.|
|[Streaming Stock Trades](https://bl.ocks.org/timkpaine/064a50a309f25b80c9cfb0b2b84fbdf3)|A streaming financial data demo.|
|[CSV](https://bl.ocks.org/texodus/02d8fd10aef21b19d6165cf92e43e668)|Upload a CSV of your own.|
|[NYC Citibike](https://bl.ocks.org/texodus/bc8d7e6f72e09c9dbd7424b4332cacad)|An example of a join on two real-time datasets, from the NYC Citibike feed.|
|[Real-time cryptocurrency charting](https://bl.ocks.org/ColinEberhardt/6e287f871410ecd970b038343b166514)|An example that uses the coinbased web socket feed to plot orders in real-time|
|[Financial Data from IEX](https://bl.ocks.org/timkpaine/97e0e7389875f3d21095e434e361a18f)|An example that uses the [IEX cloud](https://iexcloud.io) api to build a financial dashboard.|

## Documentation

* [Project Site](https://perspective.finos.org/)
* [Installation](https://perspective.finos.org/docs/md/installation.html)
* [Javascript User's Guide](https://perspective.finos.org/docs/md/js.html)
* [Python User's Guide](https://perspective.finos.org/docs/md/python.html)
* [Developer's Guide](https://perspective.finos.org/docs/md/development.html)
* [Perspective API](https://github.com/finos/perspective/blob/master/packages/perspective/README.md)
* [Perspective Viewer API](https://github.com/finos/perspective/blob/master/packages/perspective-viewer/README.md)
* [Perspective Python API](https://perspective.finos.org/docs/obj/perspective-python.html)
