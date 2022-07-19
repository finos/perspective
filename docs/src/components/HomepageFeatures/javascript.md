## JavaScript

Interactive dashboards built on Perspective.js
[Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
are easy to integrate into any web application framework.

Using Perspective's simple query language, elements like
`<perspective-viewer>` can be _symmetrically_ configured via API or User
interaction. Web Applications built with Perspective Custom Elements can be
re-hydrated from their serialized state, driven from external Events, or
persisted to any store. Workspaces can mix virtual, server-side Python data
with in-browser client data seamlessly, and independent data Views can be
cross-filtered, duplicated, exported, stacked and saved.

To achieve Desktop-like performance in the Browser, Perspective.js
relies on [WebAssembly](https://webassembly.org/) for excellent
_query calculation_ time, and [Apache Arrow](https://arrow.apache.org/)
for its conservative _memory footprint_ and efficient _data serialization_.
