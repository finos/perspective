# Perspective

[![Build Status](https://travis-ci.org/jpmorganchase/perspective.svg?branch=master)](https://travis-ci.org/jpmorganchase/perspective)
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
  [HighCharts](https://github.com/highcharts/highcharts) and 
  [Hypergrid](https://github.com/fin-hypergrid/core).

- Runtimes for the Browser and Node.js.

## Examples

* [Superstore](https://jsfiddle.net/texodus/gsoybtrp/show/) A static `superstore.arrow` demo.
* [Olympics](https://jsfiddle.net/texodus/eax9tqbm/show/) An example of sharing a single `perspective.table` among multiple `<perspective-viewer>`s.
* [Streaming](https://jsfiddle.net/texodus/84u926L1/show/) A streaming random data demo.
* [CSV](https://jsfiddle.net/texodus/pcrnd4jg/show/) Upload a CSV of your own.
* [NYC Citibike](https://jsfiddle.net/texodus/m2rwz690/) An example of a join on two real-time datasets, from the NYC Citibike feed.
* [Real-time cryptocurrency charting](https://bl.ocks.org/ColinEberhardt/6e287f871410ecd970b038343b166514) An example that uses the coinbased web socket feed to plot orders in real-time

## Documentation

* [Project Site](https://jpmorganchase.github.io/perspective/)
* [Installation](https://jpmorganchase.github.io/perspective/docs/installation.html)
* [User's Guide](https://jpmorganchase.github.io/perspective/docs/usage.html)
* [Perspective API](https://jpmorganchase.github.io/perspective/docs/perspective.html)
* [Perspective Viewer API](https://jpmorganchase.github.io/perspective/docs/perspective-viewer.html)
