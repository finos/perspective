<br />
<a href="https://perspective.finos.org">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://github.com/finos/perspective/raw/master/docs/static/svg/perspective-logo-dark.svg?raw=true">
<img width="260" src="https://github.com/finos/perspective/raw/master/docs/static/svg/perspective-logo-light.svg?raw=true">
</picture>
</a>
<br/><br/>

[![Build Status](https://img.shields.io/github/actions/workflow/status/finos/perspective/build.yaml?event=push&style=for-the-badge)](https://github.com/finos/perspective/actions/workflows/build.yaml)
[![npm](https://img.shields.io/npm/v/@finos/perspective.svg?style=for-the-badge)](https://www.npmjs.com/package/@finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg?style=for-the-badge)](https://pypi.python.org/pypi/perspective-python)
[![crates.io](https://img.shields.io/crates/v/perspective?style=for-the-badge)](https://crates.io/crates/perspective)

<br/>

Perspective is an <i>interactive</i> analytics and data visualization component,
which is especially well-suited for <i>large</i> and/or <i>streaming</i>
datasets. Use it to create user-configurable reports, dashboards, notebooks and
applications.

### Features

-   A fast, memory efficient streaming query engine, written in C++ and compiled
    for [WebAssembly](https://webassembly.org/),
    [Python](https://www.python.org/) and [Rust](https://www.rust-lang.org/),
    with read/write/streaming for [Apache Arrow](https://arrow.apache.org/), and
    a high-performance columnar expression language based on
    [ExprTK](https://github.com/ArashPartow/exprtk).

-   A framework-agnostic User Interface packaged as a
    [Custom Element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements),
    powered either in-browser via WebAssembly or virtually via WebSocket server
    (Python/Node/Rust).

-   A [JupyterLab](https://jupyter.org/) widget and Python client library, for
    interactive data analysis in a notebook, as well as _scalable_ production
    applications.

### Documentation

-   [Project Site](https://perspective.finos.org/)
-   [User Guide](https://perspective.finos.org/guide/)
-   Python API
    -   [`perspective`](https://perspective.finos.org/python/index.html)
    -   [`perspective.widget`](https://perspective.finos.org/python/perspective/widget.html)
    -   [`perspective.handlers.aiohttp`](https://perspective.finos.org/python/perspective/handlers/aiohttp.htm)
    -   [`perspective.handlers.starlette`](https://perspective.finos.org/python/perspective/handlers/starlett.htm)
    -   [`perspective.handlers.tornado`](https://perspective.finos.org/python/perspective/handlers/tornado.htm)
-   JavaScript API
    -   [`@finos/perspective` Browser](https://perspective.finos.org/browser/modules/src_ts_perspective.browser.ts.html)
    -   [`@finos/perspective` Node.js](https://perspective.finos.org/node/modules/src_ts_perspective.node.ts.html)
    -   [`@finos/perspective-viewer`](https://perspective.finos.org/viewer/modules/perspective-viewer.html)
    -   [`@finos/perspective-react`](https://perspective.finos.org/react/index.html)
-   Rust API
    -   [`perspective`](https://docs.rs/perspective/latest/perspective/)
    -   [`perspective-client`](https://docs.rs/perspective-client/latest/perspective_client/)
    -   [`perspective-server`](https://docs.rs/perspective-server/latest/perspective_server/)
    -   [`perspective-python`](https://docs.rs/perspective-python/latest/perspective_python/)
    -   [`perspective-js`](https://docs.rs/perspective-js/latest/perspective_js/)
    -   [`perspective-viewer`](https://docs.rs/perspective-viewer/latest/perspective_viewer/)

### Examples

<!-- Examples -->
<table><tbody><tr><td>editable</td><td>file</td><td>fractal</td></tr><tr><td><a href="https://perspective.finos.org/block?example=editable"><img height="125" src="https://perspective.finos.org/blocks/editable/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=file"><img height="125" src="https://perspective.finos.org/blocks/file/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=fractal"><img height="125" src="https://perspective.finos.org/blocks/fractal/preview.png?"></img></a></td></tr><tr><td>market</td><td>raycasting</td><td>evictions</td></tr><tr><td><a href="https://perspective.finos.org/block?example=market"><img height="125" src="https://perspective.finos.org/blocks/market/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=raycasting"><img height="125" src="https://perspective.finos.org/blocks/raycasting/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=evictions"><img height="125" src="https://perspective.finos.org/blocks/evictions/preview.png?"></img></a></td></tr><tr><td>nypd</td><td>streaming</td><td>covid</td></tr><tr><td><a href="https://perspective.finos.org/block?example=nypd"><img height="125" src="https://perspective.finos.org/blocks/nypd/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=streaming"><img height="125" src="https://perspective.finos.org/blocks/streaming/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=covid"><img height="125" src="https://perspective.finos.org/blocks/covid/preview.png?"></img></a></td></tr><tr><td>webcam</td><td>movies</td><td>superstore</td></tr><tr><td><a href="https://perspective.finos.org/block?example=webcam"><img height="125" src="https://perspective.finos.org/blocks/webcam/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=movies"><img height="125" src="https://perspective.finos.org/blocks/movies/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=superstore"><img height="125" src="https://perspective.finos.org/blocks/superstore/preview.png?"></img></a></td></tr><tr><td>citibike</td><td>olympics</td><td>dataset</td></tr><tr><td><a href="https://perspective.finos.org/block?example=citibike"><img height="125" src="https://perspective.finos.org/blocks/citibike/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=olympics"><img height="125" src="https://perspective.finos.org/blocks/olympics/preview.png?"></img></a></td><td><a href="https://perspective.finos.org/block?example=dataset"><img height="125" src="https://perspective.finos.org/blocks/dataset/preview.png?"></img></a></td></tr></tbody></table>
<!-- Examples -->

### Media

<table><tbody>
<tr>
<td><a href="https://github.com/timkpaine"><code>@timkpaine</code></a></td>
<td><a href="https://github.com/timbess"><code>@timbess</code></a></td>
<td><a href="https://github.com/sc1f"><code>@sc1f</code></a></td>
</tr>
<tr>
<td><a href="https://www.youtube.com/watch?v=v5Y5ftlGNhU"><img width="240" src="https://img.youtube.com/vi/v5Y5ftlGNhU/0.jpg" /></a></td>
<td><a href="https://www.youtube.com/watch?v=lDpIu4dnp78"><img width="240" src="https://img.youtube.com/vi/lDpIu4dnp78/0.jpg" /></a></td>
<td><a href="https://www.youtube.com/watch?v=IO-HJsGdleE"><img width="240"  src="https://img.youtube.com/vi/IO-HJsGdleE/0.jpg" /></a></td>
</tr>
<tr>
<td><a href="https://github.com/texodus"><code>@texodus</code></a></td>
<td><a href="https://github.com/texodus"><code>@texodus</code></a></td>
<td></td>
</tr>
<tr>
<td><a href="https://www.youtube.com/watch?v=no0qChjvdgQ"><img width="240" src="https://img.youtube.com/vi/no0qChjvdgQ/0.jpg" /></a></td>
<td><a href="https://www.youtube.com/watch?v=0ut-ynvBpGI"><img width="240" src="https://img.youtube.com/vi/0ut-ynvBpGI/0.jpg" /></a></td>
<td></td>
</tr>
</tbody></table>
