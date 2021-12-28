# @finos/perspective-viewer

Module for the `<perspective-viewer>` custom element.  This module has no
(real) exports, but importing it has a side effect: the
`PerspectiveViewerElement`class is registered as a custom element, after
which it can be used as a standard DOM element.

Though `<perspective-viewer>` is written mostly in Rust, the nature
of WebAssembly's compilation makes it a dynamic module;  in order to
guarantee that the Custom Elements extension methods are registered
synchronously with this package's import, we need perform said registration
within this wrapper module.  As a result, the API methods of the Custom
Elements are all `async` (as they must await the wasm module instance).

The documentation in this module defines the instance structure of a
`<perspective-viewer>` DOM object instantiated typically, through HTML or any
relevent DOM method e.g. `document.createElement("perspective-viewer")` or
`document.getElementsByTagName("perspective-viewer")`.

## Table of contents

### Classes

- [HTMLPerspectiveViewerElement](#HTMLPerspectiveViewerElement)
- [HTMLPerspectiveViewerPluginElement](#HTMLPerspectiveViewerPluginElement)

### Interfaces

- [IPerspectiveViewerPlugin](#IPerspectiveViewerPlugin)

### Type aliases

- [PerspectiveViewerConfig](#perspectiveviewerconfig)

### Properties

- [default](#default)

## Type aliases

### PerspectiveViewerConfig

Ƭ **PerspectiveViewerConfig**: `perspective.ViewConfig` & { `plugin?`: `string` ; `plugin_config?`: `any` ; `settings?`: `boolean`  }

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:20](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L20)

## Properties

### default

• **default**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `HTMLPerspectiveViewerElement` | typeof [`HTMLPerspectiveViewerElement`](#`HTMLPerspectiveViewerElement`) |
| `HTMLPerspectiveViewerPluginElement` | typeof [`HTMLPerspectiveViewerPluginElement`](#`HTMLPerspectiveViewerPluginElement`) |


# Class: HTMLPerspectiveViewerElement

The Custom Elements implementation for `<perspective-viewer>`, as well at its
API.  `PerspectiveViewerElement` should not be constructed directly (like its
parent class `HTMLElement`);  instead, use `document.createElement()` or
declare your `<perspective-viewer>` element in HTML.  Once instantiated,
`<perspective-viewer>` works just like a standard `HTMLElement`, with a few
extra perspective-specific methods.

**`example`**
```javascript
const viewer = document.createElement("perspective-viewer");
```

**`example`**
```javascript
document.body.innerHTML = `
    <perspective-viewer id="viewer"></perspective-viewer>
`;
const viewer = document.body.querySelector("#viewer");
```

## Hierarchy

- `HTMLElement`

  ↳ **`HTMLPerspectiveViewerElement`**

## Table of contents

### Data Methods

- [getTable](#gettable)
- [getView](#getview)
- [load](#load)

### Persistence Methods

- [reset](#reset)
- [restore](#restore)
- [save](#save)

### Plugin Methods

- [getAllPlugins](#getallplugins)
- [getPlugin](#getplugin)
- [registerPlugin](#registerplugin)

### UI Action Methods

- [copy](#copy)
- [download](#download)
- [toggleConfig](#toggleconfig)

### Util Methods

- [delete](#delete)
- [flush](#flush)
- [getEditPort](#geteditport)
- [notifyResize](#notifyresize)
- [restyleElement](#restyleelement)
- [setAutoSize](#setautosize)
- [setThrottle](#setthrottle)

## Data Methods

### getTable

▸ **getTable**(`wait_for_table?`): `Promise`<`Table`\>

Returns the `perspective.Table()` which was supplied to `load()`

**`example`** Share a `Table`
```javascript
const viewers = document.querySelectorAll("perspective-viewer");
const [viewer1, viewer2] = Array.from(viewers);
const table = await viewer1.getTable();
await viewer2.load(table);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait_for_table?` | `boolean` | Whether to await `load()` if it has not yet been invoked, or fail immediately. |

#### Returns

`Promise`<`Table`\>

A `Promise` which resolves to a `perspective.Table`

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:187](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L187)

___

### getView

▸ **getView**(): `Promise`<`View`\>

Returns the underlying `perspective.View` currently configured for this
`<perspective-viewer>`.  Because ownership of the `perspective.View` is
mainainted by the `<perspective-viewer>` it was created by, this `View`
may become deleted (invalidated by calling `delete()`) at any time -
specifically, it will be deleted whenever the `PerspectiveViewConfig`
changes.  Because of this, when using this API, prefer calling
`getView()` repeatedly over caching the returned `perspective.View`,
especially in `async` contexts.

**`example`** Collapse grid to root
```javascript
const viewer = document.querySelector("perspective-viewer");
const view = await viewer.getView();
await view.set_depth(0);
```

#### Returns

`Promise`<`View`\>

A `Promise` which ressolves to a `perspective.View`.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:211](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L211)

___

### load

▸ **load**(`table`): `Promise`<`void`\>

Load a `perspective.Table`.  If `load` or `update` have already been
called on this element, its internal `perspective.Table` will _not_ be
deleted, but it will bed de-referenced by this `<perspective-viewer>`.

**`example`** Load perspective.table
```javascript
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

**`example`** Load Promise<perspective.table>
```javascript
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `table` | `Table` \| `Promise`<`Table`\> |

#### Returns

`Promise`<`void`\>

A promise which resolves once the data is
loaded, a `perspective.View` has been created, and the active plugin has
rendered.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:119](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L119)

___

## Persistence Methods

### reset

▸ **reset**(`all?`): `Promise`<`void`\>

Reset's this element's view state and attributes to default.  Does not
delete this element's `perspective.table` or otherwise modify the data
state.

**`example`**
```javascript
const viewer = document.querySelector("perspective-viewer");
await viewer.reset();
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `all` | `boolean` | `false` | Should `expressions` param be reset as well, defaults to |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:330](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L330)

___

### restore

▸ **restore**(`config`): `Promise`<`void`\>

Restore this element to a state as generated by a reciprocal call to
`save`.  In `json` (default) format, `PerspectiveViewerConfig`'s fields
have specific semantics:

 - When a key is missing, this field is ignored;  `<perspective-viewer>`
   will maintain whatever settings for this field is currently applied.
 - When the key is supplied, but the value is `undefined`, the field is
   reset to its default value for this current `View`, i.e. the state it
   would be in after `load()` resolves.
 - When the key is defined to a value, the value is applied for this
   field.

This behavior is convenient for explicitly controlling current vs desired
UI state in a single request, but it does make it a bit inconvenient to
use `restore()` to reset a `<perspective-viewer>` to default as you must
do so explicitly for each key;  for this case, use `reset()` instead of
restore.

As noted in `save()`, this configuration state does not include the
`Table` or its `Schema`.  In order for `restore()` to work correctly, it
must be called on a `<perspective-viewer>` that has a `Table already
`load()`-ed, with the same (or a type-compatible superset) `Schema`.
It does not need have the same rows, or even be populated.

**`example`** Restore a viewer from `localStorage`
```javascript
const viewer = document.querySelector("perspective-viewer");
const token = localStorage.getItem("viewer_state");
await viewer.restore(token);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | `string` \| [`PerspectiveViewerConfig`](#perspectiveviewerconfig) \| `ArrayBuffer` | returned by `save()`.  This can be any format returned by `save()`; the specific deserialization is chosen by `typeof config`. |

#### Returns

`Promise`<`void`\>

A promise which resolves when the changes have been applied and
rendered.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:254](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L254)

___

### save

▸ **save**(): `Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

Serialize this element's attribute/interaction state, but _not_ the
`perspective.Table` or its `Schema`.  `save()` is designed to be used in
conjunction with `restore()` to persist user settings and bookmarks, but
the `PerspectiveViewerConfig` object returned in `json` format can also
be written by hand quite easily, which is useful for authoring
pre-conceived configs.

**`example`** Save a viewer to `localStorage`
```javascript
const viewer = document.querySelector("perspective-viewer");
const token = await viewer.save("string");
localStorage.setItem("viewer_state", token);
```

#### Returns

`Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

a serialized element in the chosen format.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:281](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L281)

▸ **save**(`format`): `Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"json"`` |

#### Returns

`Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:282](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L282)

▸ **save**(`format`): `Promise`<`ArrayBuffer`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"arraybuffer"`` |

#### Returns

`Promise`<`ArrayBuffer`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:283](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L283)

▸ **save**(`format`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"string"`` |

#### Returns

`Promise`<`string`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:284](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L284)

___

## Plugin Methods

### getAllPlugins

▸ **getAllPlugins**(): `Promise`<`HTMLElement`[]\>

Get all plugin custom element instances, in order of registration.

If no plugins have been registered (via `registerPlugin()`), calling
`getAllPlugins()` will cause `perspective-viewer-plugin` to be registered
as a side effect.

#### Returns

`Promise`<`HTMLElement`[]\>

An `Array` of the plugin instances for this
`<perspective-viewer>`.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:502](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L502)

___

### getPlugin

▸ **getPlugin**(`name?`): `Promise`<`HTMLElement`\>

Get the currently active plugin custom element instance, or a specific
named instance if requested.  `getPlugin(name)` does not activate the
plugin requested, so if this plugin is not active the returned
`HTMLElement` will not have a `parentElement`.

If no plugins have been registered (via `registerPlugin()`), calling
`getPlugin()` will cause `perspective-viewer-plugin` to be registered as
a side effect.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name?` | `string` | Optionally a specific plugin name, defaulting to the current active plugin. |

#### Returns

`Promise`<`HTMLElement`\>

The active or requested plugin instance.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:485](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L485)

___

### registerPlugin

▸ `Static` **registerPlugin**(`name`): `Promise`<`void`\>

Register a new plugin via its custom element name.  This method is called
automatically as a side effect of importing a plugin module, so this
method should only typically be called by plugin authors.

**`example`**
```javascript
customElements.get("perspective-viewer").registerPlugin("my-plugin");
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The `name` of the custom element to register, as supplied to the `customElements.define(name)` method. |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:91](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L91)

___

## UI Action Methods

### copy

▸ **copy**(`flat`): `Promise`<`void`\>

Copies this element's view data (as a CSV) to the clipboard.  This method
must be called from an event handler, subject to the browser's
restrictions on clipboard access.  See
[https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard](https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard).

**`example`**
```javascript
const viewer = document.querySelector("perspective-viewer");
const button = document.querySelector("button");
button.addEventListener("click", async () => {
    await viewer.copy();
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `flat` | `boolean` | Whether to use the element's current view config, or to use a default "flat" view. |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:379](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L379)

___

### download

▸ **download**(`flat`): `Promise`<`void`\>

Download this element's data as a CSV file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `flat` | `boolean` | Whether to use the element's current view config, or to use a default "flat" view. |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:356](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L356)

___

### toggleConfig

▸ **toggleConfig**(`force?`): `Promise`<`void`\>

Opens/closes the element's config menu, equivalent to clicking the
settings button in the UI.  This method is equivalent to
`viewer.restore({settings: force})` when `force` is present, but
`restore()` cannot toggle as `toggleConfig()` can, you would need to
first read the settings state from `save()` otherwise.

Calling `toggleConfig()` may be delayed if an async render is currently
in process, and it may only partially render the UI if `load()` has not
yet resolved.

**`example`**
```javascript
await viewer.toggleConfig();
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `force?` | `boolean` | If supplied, explicitly set the config state to "open" (`true`) or "closed" (`false`). |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:465](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L465)

___

## Util Methods

### delete

▸ **delete**(): `Promise`<`void`\>

Deletes this element and clears it's internal state (but not its
user state).  This (or the underlying `perspective.view`'s equivalent
method) must be called in order for its memory to be reclaimed, as well
as the reciprocal method on the `perspective.table` which this viewer is
bound to.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:344](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L344)

___

### flush

▸ **flush**(): `Promise`<`void`\>

Flush any pending modifications to this `<perspective-viewer>`.  Since
`<perspective-viewer>`'s API is almost entirely `async`, it may take
some milliseconds before any method call such as `restore()` affects
the rendered element.  If you want to make sure any invoked method which
affects the rendered has had its results rendered, call and await
`flush()`

**`example`** Flush an unawaited `restore()`
```javascript
const viewer = document.querySelector("perspective-viewer");
viewer.restore({row_pivots: ["State"]});
await viewer.flush();
console.log("Viewer has been rendered with a pivot!");
```

#### Returns

`Promise`<`void`\>

A promise which resolves when the current
pending state changes have been applied and rendered.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:312](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L312)

___

### getEditPort

▸ **getEditPort**(): `Promise`<`number`\>

Gets the edit port, the port number for which `Table` updates from this
`<perspective-viewer>` are generated.  This port number will be present
in the options object for a `View.on_update()` callback for any update
which was originated by the `<perspective-viewer>`/user, which can be
used to distinguish server-originated updates from user edits.

**`example`**
```javascript
const viewer = document.querySelector("perspective-viewer");
const editport = await viewer.getEditPort();
const table = await viewer.getTable();
const view = await table.view();
view.on_update(obj => {
    if (obj.port_id = editport) {
        console.log("User edit detected");
    }
});
```

#### Returns

`Promise`<`number`\>

A promise which resolves to the current edit port.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:420](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L420)

___

### notifyResize

▸ **notifyResize**(`force?`): `Promise`<`void`\>

Redraw this `<perspective-viewer>` and plugin when its dimensions or
visibility has been updated.  By default, `<perspective-viewer>` will
auto-size when its own dimensions change, so this method need not be
called;  when disabled via `setAutoSize(false)` however, this method
_must_ be called, and will not respond to dimension or style changes to
its parent container otherwise.  `notifyResize()` does not recalculate
the current `View`, but all plugins will re-request the data window
(which itself may be smaller or larger due to resize).

**`example`** Bind `notfyResize()` to browser dimensions
```javascript
const viewer = document.querySelector("perspective-viewer");
viewer.setAutoSize(false);
window.addEventListener("resize", () => viewer.notifyResize());
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `force` | `boolean` | `false` | Whether to re-render, even if the dimenions have not changed.  When set to `false` and auto-size is enabled (the defaults), calling this method will automatically disable auto-size. |

#### Returns

`Promise`<`void`\>

A `Promise<void>` which resolves when this resize event has
finished rendering.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:149](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L149)

___

### restyleElement

▸ **restyleElement**(): `Promise`<`void`\>

Restyles the elements and to pick up any style changes.  While most of
perspective styling is plain CSS and can be updated at any time, some
CSS rules are read and cached, e.g. the series colors for
`@finos/perspective-viewer-d3fc` which are read from CSS then reapplied
as SVG and Canvas attributes.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:393](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L393)

___

### setAutoSize

▸ **setAutoSize**(`autosize?`): `Promise`<`void`\>

Determines the auto-size behavior.  When `true` (the default), this
element will re-render itself whenever its own dimensions change,
utilizing a `ResizeObserver`;  when `false`, you must explicitly call
`notifyResize()` when the element's dimensions have changed.

**`example`** Disable auto-size
```javascript
await viewer.setAutoSize(false);
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `autosize` | `boolean` | `true` | Whether to re-render when this element's dimensions change. |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:168](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L168)

___

### setThrottle

▸ **setThrottle**(`value?`): `Promise`<`void`\>

Determines the render throttling behavior. Can be an integer, for
millisecond window to throttle render event; or, if `undefined`,
will try to determine the optimal throttle time from this component's
render framerate.

**`example`** Limit FPS to 1 frame per second
```javascript
await viewer.setThrottle(1000);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value?` | `number` | an optional throttle rate in milliseconds (integer).  If not supplied, adaptive throttling is calculated from the average plugin render time. |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:441](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/viewer.ts#L441)


# Interface: IPerspectiveViewerPlugin

The `IPerspectiveViewerPlugin` interface defines the necessary API for a
`<perspective-viewer>` plugin, which also must be an `HTMLElement` via the
Custom Elements API or otherwise.  Rather than implement this API from
scratch however, the simplest way is to inherit from
`<perspective-viewer-plugin>`, which implements `IPerspectiveViewerPlugin`
with non-offensive default implementations, where only the `draw()` and
`name()` methods need be overridden to get started with a simple plugin.

Note that plugins are frozen once a `<perspective-viewer>` has been
instantiated, so generally new plugin code must be executed at the module
level (if packaged as a library), or during application init to ensure global
availability of a plugin.

**`example`**
```javascript
const BasePlugin = customElements.get("perspective-viewer-plugin");
class MyPlugin extends BasePlugin {
    get name() {
        return "My Plugin";
    }
    async draw(view) {
        const count = await view.num_rows();
        this.innerHTML = `View has ${count} rows`;
    }
}

customElements.define("my-plugin", MyPlugin);
const Viewer = customElements.get("perspective-viewer");
Viewer.registerPlugin("my-plugin");
```

## Hierarchy

- `HTMLElement`

  ↳ **`IPerspectiveViewerPlugin`**

## Implemented by

- [`HTMLPerspectiveViewerPluginElement`](#`HTMLPerspectiveViewerPluginElement`)

## Table of contents

### Accessors

- [config\_column\_names](#config_column_names)
- [min\_config\_columns](#min_config_columns)
- [name](#name)
- [select\_mode](#select_mode)

### Methods

- [clear](#clear)
- [delete](#delete)
- [draw](#draw)
- [resize](#resize)
- [restore](#restore)
- [restyle](#restyle)
- [save](#save)
- [update](#update)

## Accessors

### config\_column\_names

• `get` **config_column_names**(): `string`[]

The named column labels, if desired.  Named columns behave differently
in drag/drop mode than unnamed columns, having replace/swap behavior
rather than insert.  If provided, the length of `config_column_names`
_must_ be `>= min_config_columns`, as this is assumed by the drag/drop
logic.

#### Returns

`string`[]

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:80](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L80)

___

### min\_config\_columns

• `get` **min_config_columns**(): `number`

The minimum number of columns required for this plugin to operate.
This mostly affects drag/drop and column remove button behavior,
preventing the use from applying configs which violate this min.

While this option can technically be `undefined` (as in the case of
`@finos/perspective-viewer-datagrid`), doing so currently has nearly
identical behavior to 1.

#### Returns

`number`

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:71](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L71)

___

### name

• `get` **name**(): `string`

The name for this plugin, which is used as both it's unique key for use
as a parameter for the `plugin` field of a `ViewerConfig`, and as the
display name for this plugin in the `<perspective-viewer>` UI.

#### Returns

`string`

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:52](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L52)

___

### select\_mode

• `get` **select_mode**(): ``"select"`` \| ``"toggle"``

Select mode determines how column add/remove buttons behave for this
plugin.  `"select"` mode exclusively selects the added column, removing
other columns.  `"toggle"` mode toggles the column on or off (dependent
on column state), leaving existing columns alone.

#### Returns

``"select"`` \| ``"toggle"``

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:60](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L60)

## Methods

### clear

▸ **clear**(): `Promise`<`void`\>

Clear this plugin, though it is up to the discretion of the plugin
author to determine what this means.  Defaults to resetting this
element's `innerHTML`, so be sure to override if you want custom
behavior.

**`example`**
```javascript
async clear(): Promise<void> {
    this.innerHTML = "";
}
```

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:124](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L124)

___

### delete

▸ **delete**(): `Promise`<`void`\>

Free any resources acquired by this plugin and prepare to be deleted.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:159](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L159)

___

### draw

▸ **draw**(`view`): `Promise`<`void`\>

Render this plugin using the provided `View`.  While there is no
provision to cancel a render in progress per se, calling a method on
a `View` which has been deleted will throw an exception.

**`example`**
```
async draw(view: perspective.View): Promise<void> {
    const csv = await view.to_csv();
    this.innerHTML = `<pre>${csv}</pre>`;
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `view` | `View` |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:95](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L95)

___

### resize

▸ **resize**(): `Promise`<`void`\>

Like `update()`, but for when the dimensions of the plugin have changed
and the underlying data has not.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:130](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L130)

___

### restore

▸ **restore**(`config`): `Promise`<`void`\>

Restore this plugin to a state previously returned by `save()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `any` |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:154](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L154)

___

### restyle

▸ **restyle**(): `Promise`<`void`\>

Notify the plugin that the style environment has changed.  Useful for
plugins which read CSS styles via `window.getComputedStyle()`.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:136](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L136)

___

### save

▸ **save**(): `Promise`<`any`\>

Save this plugin's state to a JSON-serializable value.  While this value
can be anything, it should work reciprocally with `restore()` to return
this plugin's renderer to the same state, though potentially with a
different `View`.

`save()` should be used for user-persistent settings that are
data-agnostic, so the user can have persistent view during refresh or
reload.  For example, `@finos/perspective-viewer-d3fc` uses
`plugin_config` to remember the user-repositionable legend coordinates.

#### Returns

`Promise`<`any`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:149](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L149)

___

### update

▸ **update**(`view`): `Promise`<`void`\>

Draw under the assumption that the `ViewConfig` has not changed since
the previous call to `draw()`, but the underlying data has.  Defaults to
dispatch to `draw()`.

**`example`**
```javascript
async update(view: perspective.View): Promise<void> {
    return this.draw(view);
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `view` | `View` |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:109](https://github.com/finos/perspective/blob/a87d11528/rust/perspective-viewer/src/ts/plugin.ts#L109)


