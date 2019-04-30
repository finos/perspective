# [![Perspective](https://jpmorganchase.github.io/perspective/img/title.png)](https://jpmorganchase.github.io/perspective/)

[![Build Status](https://travis-ci.org/jpmorganchase/perspective.svg?branch=master)](https://travis-ci.org/jpmorganchase/perspective)
[![Appveyor](https://ci.appveyor.com/api/projects/status/github/jpmorganchase/perspective?svg=true)](https://ci.appveyor.com/project/neilslinger/perspective)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/jpmorganchase/perspective)
[![npm](https://img.shields.io/npm/v/@jpmorganchase/perspective.svg?style=flat-square)](https://www.npmjs.com/package/@jpmorganchase/perspective)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![FINOS - Operating](https://cdn.rawgit.com/finos/contrib-toolbox/master/images/badge-operating.svg)](https://finosfoundation.atlassian.net/wiki/display/FINOS/Operating)


A streaming data visualization engine for Javascript, Perspective makes it
simple to build real-time & user configurable analytics entirely in the browser.

<img src="https://jpmorganchase.github.io/perspective/img/demo.gif">

## Features

- A fast, memory efficient streaming pivot engine written principally in C++ and
  compiled to both WebAssembly and asm.js via the
  [emscripten](https://github.com/kripken/emscripten) compiler.

- An embeddable, framework-agnostic configuration UI, based
  on [Web Components](https://www.webcomponents.org/), and a WebWorker engine
  host for responsiveness at high frequency.

- A suite of simple visualization plugins for some common Javascript libraries such as
  [d3fc](https://d3fc.io/), [Hypergrid](https://github.com/fin-hypergrid/core) and
  [HighCharts](https://github.com/highcharts/highcharts).

- Integration with [Jupyterlab](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective-jupyterlab).

- Runtimes for the Browser and Node.js.

## Examples
|||
|:--|:--|
|[Superstore](https://bl.ocks.org/JHawk/b29192cd425bfc9443dd12626cc2f606)| A static `superstore.arrow` demo.|
|[Linked Superstore](https://bl.ocks.org/JHawk/9b20383f042853f27c6e720baf4a19db)| An example of `<perspective-viewer>`s linked through click events.|
|[Olympics](https://bl.ocks.org/JHawk/2a29387438af750614cc983f23040732)| An example of sharing a single `perspective.table` among multiple `<perspective-viewer>`s.|
|[Streaming](https://bl.ocks.org/JHawk/952262145299ffd7fa58d22a51de905d)| A streaming random data demo.|
|[Streaming Stock Trades](https://bl.ocks.org/timkpaine/064a50a309f25b80c9cfb0b2b84fbdf3)|A streaming financial data demo.|
|[CSV](https://bl.ocks.org/JHawk/ef28337d5c96c0360f07ca502b872c10)|Upload a CSV of your own.|
|[NYC Citibike](https://bl.ocks.org/JHawk/ade09a2ea62bb708cc0beab8c35609b0)|An example of a join on two real-time datasets, from the NYC Citibike feed.|
|[Real-time cryptocurrency charting](https://bl.ocks.org/ColinEberhardt/6e287f871410ecd970b038343b166514)|An example that uses the coinbased web socket feed to plot orders in real-time|
|[Financial Data from IEX](https://bl.ocks.org/timkpaine/97e0e7389875f3d21095e434e361a18f)|An example that uses the [IEX cloud](https://iexcloud.io) api to build a financial dashboard.|

## Documentation

* [Project Site](https://jpmorganchase.github.io/perspective/)
* [Installation](https://jpmorganchase.github.io/perspective/docs/installation.html)
* [User's Guide](https://jpmorganchase.github.io/perspective/docs/usage.html)
* [Developer's Guide](https://jpmorganchase.github.io/perspective/docs/development.html)
* [Perspective API](https://github.com/jpmorganchase/perspective/blob/master/packages/perspective/README.md)
* [Perspective Viewer API](https://github.com/jpmorganchase/perspective/blob/master/packages/perspective-viewer/README.md)