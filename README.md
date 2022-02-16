# [![Perspective](https://perspective.finos.org/img/logo_inverted_tiny.png)](https://perspective.finos.org/)

[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=flat)](https://www.npmjs.com/package/@finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg?style=flat)](https://pypi.python.org/pypi/perspective-python)
[![Build Status](https://dev.azure.com/finosfoundation/perspective/_apis/build/status/finos.perspective?branchName=master)](https://dev.azure.com/finosfoundation/perspective/_build/latest?definitionId=1&branchName=master)
[![FINOS - Active](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-active.svg)](https://finosfoundation.atlassian.net/wiki/display/FINOS/Active)


Perspective is an <i>interactive</i> analytics and data visualization component, 
which is especially well-suited for <i>large</i> and/or <i>streaming</i> datasets.
Originally developed at J.P. Morgan and open-sourced through the
[Fintech Open Source Foundation (FINOS)](https://www.finos.org/), 
Perspective makes it simple to build user-configurable
analytics entirely in the browser, or in concert with Python and/or
[Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/).
Use it to create reports, dashboards, notebooks and applications, with static
data or streaming updates via [Apache Arrow](https://arrow.apache.org/).

* A fast, memory efficient streaming query engine, written in
  C++ and compiled for both [WebAssembly](https://webassembly.org/) and
  [Python](https://www.python.org/). read/write/streaming for
  [Apache Arrow](https://arrow.apache.org/), and a high-performance columnar
  expression language based on [ExprTK](https://github.com/ArashPartow/exprtk).

* A framework-agnostic User Interface
  [Custom Element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements),
  powered either in-browser via WebWorker (WebAssembly) or virtually via
  WebSocket server (Python/Node), as well as a suite of Datagrid and 
  [D3FC](https://d3fc.io/) Chart plugins.

* A [JupyterLab](https://jupyter.org/) widget and Python client library, for
  interactive data analysis in a notebook, as well as _scalable_ production
  [Voila](https://github.com/voila-dashboards/voila) and
  [Holoviz](https://panel.holoviz.org/) applications.

<br/>
<img width="770" src="https://github.com/finos/perspective/blob/gh-pages/img/demo_large.gif?raw=true">

## Examples

||||
|:--|:--|:--|
|Movies|Magic|NFT|
|[![Movies](https://gist.githubusercontent.com/texodus/6b4dcebf65db4ebe4fe53a6de5ea0b48/raw/f56e588eed348aea579cf8fe757ce78c58779c82/thumbnail.png)](https://bl.ocks.org/texodus/6b4dcebf65db4ebe4fe53a6de5ea0b48)|[![Magic](https://perspective.finos.org/img/mtg_thumbnail.png)](https://texodus.github.io/mtg-perspective/?seasons-in-the-abyss-67)|[<img src="https://sc1f.github.io/pudgy-penguin-perspective/meta.png" width="230" height="120"></img>](https://sc1f.github.io/pudgy-penguin-perspective/)|
|NYPD CCRB|Olympics|COVID|
|[<img src="https://texodus.github.io/nypd-ccrb/preview.png" width="230" height="120"></img>](https://texodus.github.io/nypd-ccrb/)|[![Olympics](http://bl.ocks.org/texodus/raw/efd4a857aca9a52ab6cddbb6e1f701c9/c6c0fb7611ca742830e05cce667678c25b6f288a/thumbnail.png)](https://bl.ocks.org/texodus/efd4a857aca9a52ab6cddbb6e1f701c9)|[![COVID](https://gist.githubusercontent.com/texodus/e074d7d9e5783e680d35f565d2b4b32e/raw/7c2b8821333a5d6e90a8d0748ecb2062c798c5e6/thumbnail.png)](https://bl.ocks.org/texodus/e074d7d9e5783e680d35f565d2b4b32e)|
|Custom Styles|BTC|Fractal|
|[![Custom Styles](http://bl.ocks.org/texodus/raw/c42f3189699bd29cf20bbe7dce767b07/62d75a47e049602312ba2597bfd37eb032b156f0/thumbnail.png)](http://bl.ocks.org/texodus/c42f3189699bd29cf20bbe7dce767b07)|[<img src="https://sc1f.github.io/perspective-btc-liquidity/meta.png" width="230" height="120"></img>](https://sc1f.github.io/perspective-btc-liquidity/)|[![Fractal](https://bl.ocks.org/texodus/raw/5485f6b630b08d38218822e507f09f21/2e5f128865d1ffb4b73d1fdf59fcb6705d78071e/thumbnail.png)](https://bl.ocks.org/texodus/5485f6b630b08d38218822e507f09f21)|
|Editable|Maps Airports|Streaming|
|[![Editable](https://bl.ocks.org/texodus/raw/45b868833c9f456bd39a51e606412c5d/e590d237a5237790694946018680719c9fef56cb/thumbnail.png)](https://bl.ocks.org/texodus/45b868833c9f456bd39a51e606412c5d)|[![Maps Airpors](https://perspective.finos.org/img/airports_thumbnail.png)](https://bl.ocks.org/DevAndyLee/86b33055dbce1ccc709cb3238227bec1)|[![Streaming](https://bl.ocks.org/texodus/raw/9bec2f8041471bafc2c56db2272a9381/c69c2cfacb23015f3aaeab3555a0035702ffdb1c/thumbnail.png)](https://bl.ocks.org/texodus/9bec2f8041471bafc2c56db2272a9381)|
|NYC Citibike|JupyterLab Plugin|Maps Citibike|
|[![NYC Citibike](https://bl.ocks.org/texodus/raw/bc8d7e6f72e09c9dbd7424b4332cacad/f704ce53a3f453f8fe66bd9ff4ead831786384ea/thumbnail.png)](https://bl.ocks.org/texodus/bc8d7e6f72e09c9dbd7424b4332cacad)|[![JupyterLab Plugin](https://perspective.finos.org/img/jupyterlab.png)](http://beta.mybinder.org/v2/gh/finos/perspective/master?urlpath=lab/tree/examples/jupyter-notebooks)|[![Maps Citibike](https://perspective.finos.org/img/citibike_thumbnail.png)](http://bl.ocks.org/DevAndyLee/57720f373752cd405dbbceb6f22c7854)|
|[Polygon.io](https://polygon.io)|CSV|Superstore|
|[![Polygon](https://raw.githubusercontent.com/timkpaine/polygon-io-perspective/main/docs/img/screenshot.png)](https://timkpaine.github.io/polygon-io-perspective/)|[![CSV](https://bl.ocks.org/texodus/raw/02d8fd10aef21b19d6165cf92e43e668/5e78be024893aa651fcdfac816841d54777ccdec/thumbnail.png)](https://bl.ocks.org/texodus/02d8fd10aef21b19d6165cf92e43e668)|[![Superstore](https://bl.ocks.org/texodus/raw/803de90736a3641ad91c5c7a1b49d0a7/thumbnail.png)](https://bl.ocks.org/texodus/803de90736a3641ad91c5c7a1b49d0a7)|






## Documentation

* [Project Site](https://perspective.finos.org/)
* [Table](https://perspective.finos.org/docs/md/table.html)
* [View](https://perspective.finos.org/docs/md/view.html)
* [Javascript User Guide](https://perspective.finos.org/docs/md/js.html)
* [Python User Guide](https://perspective.finos.org/docs/md/python.html)
* [Data Binding](https://perspective.finos.org/docs/md/table.html)
* [Developer Guide](https://perspective.finos.org/docs/md/development.html)
* [Perspective API](https://github.com/finos/perspective/blob/master/packages/perspective/README.md)
* [Perspective Viewer API](https://github.com/finos/perspective/blob/master/packages/perspective-viewer/README.md)
* [Perspective Python API](https://perspective.finos.org/docs/obj/perspective-python.html)

## Community

* [`perspective-viewer-maps` OpenLayers/OpenStreetMap plugin](https://github.com/DevAndyLee/perspective-viewer-maps)
* [Scott Logic / Perspective Plugin API - How to build a new plugin](https://blog.scottlogic.com/2019/04/23/perspective-plugin-api-how-to-build-a-new-plugin.html)

