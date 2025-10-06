# `PerspectiveWidget` for JupyterLab

Building on top of the API provided by `perspective.Table`, the
`PerspectiveWidget` is a JupyterLab plugin that offers the entire functionality
of Perspective within the Jupyter environment. It supports the same API
semantics of `<perspective-viewer>`, along with the additional data types
supported by `perspective.Table`. `PerspectiveWidget` takes keyword arguments
for the managed `View`:

```python
from perspective.widget import PerspectiveWidget
w = perspective.PerspectiveWidget(
    data,
    plugin="X Bar",
    aggregates={"datetime": "any"},
    sort=[["date", "desc"]]
)
```

## Creating a widget

A widget is created through the `PerspectiveWidget` constructor, which takes as
its first, required parameter a `perspective.Table`, a dataset, a schema, or
`None`, which serves as a special value that tells the Widget to defer loading
any data until later. In maintaining consistency with the Javascript API,
Widgets cannot be created with empty dictionaries or lists — `None` should be
used if the intention is to await data for loading later on. A widget can be
constructed from a dataset:

```python
from perspective.widget import PerspectiveWidget
PerspectiveWidget(data, group_by=["date"])
```

.. or a schema:

```python
PerspectiveWidget({"a": int, "b": str})
```

.. or an instance of a `perspective.Table`:

```python
table = perspective.table(data)
PerspectiveWidget(table)
```

## Updating a widget

`PerspectiveWidget` shares a similar API to the `<perspective-viewer>` Custom
Element, and has similar `save()` and `restore()` methods that
serialize/deserialize UI state for the widget.

<!--
## `PerspectiveRenderer`

Perspective also exposes a JS-only `mimerender-extension`. This lets you view
`csv`, `json`, and `arrow` files directly from the file browser. You can see
this by right clicking one of these files and `Open With->CSVPerspective` (or
`JSONPerspective` or `ArrowPerspective`). Perspective will also install itself
as the default handler for opening `.arrow` files. -->

## Depending on Perspective in your own JupyterLab Widget

Perspective provides a [token for integration with JupyterLab's federated dependency model](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#plugins-interacting-with-each-other).
This allows your plugin to simply depend on Perspective for initialization.

In your plugin code:

```javascript
import {IPerspective} from "@finos/perspective-jupyterlab";

export const MyCoolPlugin = {
  activate,
  id: "my-cool-plugin",
  requires: [IPerspective],
  autoStart: true,
};

// to use perspective, simply import. No initialization required
import perspective from "@finos/perspective";
```

And remember to add `perspective-python` as a python dependency, to ensure
the Perspective JupyterLab extension is installed.
