# Jupyter Notebook examples for `perspective-python`

This folder contains several notebooks designed as an introduction to the various features of `perspective-python`:

- `table_tutorial.ipynb` shows how to load, update, query, and serialize data using `Table` and `View`, and how to connect multiple `Table` instances together using `on_update`.
- `widget_tutorial.ipynb` demonstrates how to use `PerspectiveWidget` as a powerful interactive visualization component within a Jupyter notebook.
- `pandas_pivots.ipynb` displays Perspective's ability to read pivots from a pivoted DataFrame and automatically apply it as part of a `PerspectiveWidget`.

Each notebook is fully self-contained and should offer a good place to start for those interested in using `perspective-python` whether within a Jupyter environment or in a pure-Python context.

For examples pertaining to `perspective-python` Tornado servers, check out:

- [tornado-python](https://github.com/finos/perspective/tree/master/examples/tornado-python): a simple Tornado server that delivers a static dataset to the user using `perspective-python` and `<perspective-viewer>`.
- [tornado-streaming-python](https://github.com/finos/perspective/tree/master/examples/tornado-streaming-python): a streaming Tornado server that demonstrates `perspective-python`'s high throughput and performance in streaming scenarios.
- [workspace-editing-python](https://github.com/finos/perspective/tree/master/examples/workspace-editing-python): a full-featured example using `<perspective-workspace>` that illustrates a deep and powerful integration between `<perspective-workspace>` and `perspective-python`.