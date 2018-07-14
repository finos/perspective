# Perspective

[![Build Status](https://travis-ci.org/jpmorganchase/perspective.svg?branch=master)](https://travis-ci.org/jpmorganchase/perspective)

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

* [superstore.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/superstore-arrow.html) A static `superstore.csv` demo.
* [citibike.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/citibike.html) NYC Citibike availability map.
* [streaming.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/streaming.html) A streaming random data demo.
* [coincap.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/coincap.html) Streaming crypto currency prices via [Coincap.io](http://coincap.io/).
* [theme-material.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/theme-material.html) Material theme example.
* [csv.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/csv.html) Upload a CSV of your own.

## Documentation

* [Project Site](https://jpmorganchase.github.io/perspective/)
* [Installation](https://jpmorganchase.github.io/perspective/docs/installation.html)
* [User's Guide](https://jpmorganchase.github.io/perspective/docs/usage.html)
* [Perspective API](https://jpmorganchase.github.io/perspective/docs/perspective_api.html)
* [Perspective Viewer API](https://jpmorganchase.github.io/perspective/docs/viewer_api.html)
