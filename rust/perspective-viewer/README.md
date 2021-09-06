# @finos/perspective-viewer

Module for the `<perspective-viewer>` custom element.  This module has no
(real) exports, but importing it has a side effect: the
`PerspectiveViewerElement`class is registered as a custom element, after
which it can be used as a standard DOM element.

Though `<perspective-viewer>` is written mostly in Rust, the nature
of WebAssembly's compilation makes it a dynamic module;  in order to
guarantee that the Custom Elements extension methods are registered
synchronously with this package's import, we need perform said registration
within this wrapper module.

The documentation in this module defines the instance structure of a
`<perspective-viewer>` DOM object instantiated typically, through HTML or any
relevent DOM method e.g. `document.createElement("perspective-viewer")` or
`document.getElementsByTagName("perspective-viewer")`.

## Table of contents

### Classes

- [PerspectiveViewerElement](#PerspectiveViewerElement)

### Type aliases

- [PerspectiveViewerConfig](#perspectiveviewerconfig)

## Type aliases

### PerspectiveViewerConfig

Ƭ **PerspectiveViewerConfig**: `perspective.ViewConfig` & { `plugin?`: `string` ; `plugin_config?`: `object` ; `settings?`: `boolean`  }

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:56](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L56)


# Class: PerspectiveViewerElement

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

  ↳ **`PerspectiveViewerElement`**

## Table of contents

### Data Methods

- [getTable](#gettable)
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
- [setThrottle](#setthrottle)

## Data Methods

### getTable

▸ **getTable**(): `Promise`<`Table`\>

Returns the `perspective.Table()` which was supplied to `load()`.  If
`load()` has been called but the supplied `Promise<perspective.Table>`
has not resolved, `getTable()` will `await`;  if `load()` has not yet
been called, an `Error` will be thrown.

**`example`** <caption>Share a `Table`</caption>
```javascript
const viewers = document.querySelectorAll("perspective-viewer");
const [viewer1, viewer2] = Array.from(viewers);
const table = await viewer1.getTable();
await viewer2.load(table);
```

#### Returns

`Promise`<`Table`\>

A `Promise` which resolves to a `perspective.Table`

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:194](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L194)

___

### load

▸ **load**(`table`): `Promise`<`void`\>

Load a `perspective.Table`.  If `load` or `update` have already been
called on this element, its internal `perspective.Table` will _not_ be
deleted, but it will bed de-referenced by this `<perspective-viewer>`.

**`example`** <caption>Load perspective.table</caption>
```javascript
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

**`example`** <caption>Load Promise<perspective.table></caption>
```javascript
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `table` | `Promise`<`Table`\> |

#### Returns

`Promise`<`void`\>

A promise which resolves once the data is
loaded, a `perspective.View` has been created, and the active plugin has
rendered.

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:151](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L151)

___

## Persistence Methods

### reset

▸ **reset**(): `Promise`<`void`\>

Reset's this element's view state and attributes to default.  Does not
delete this element's `perspective.table` or otherwise modify the data
state.

**`example`**
```javascript
const viewer = document.querySelector("perspective-viewer");
await viewer.reset();
```

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:308](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L308)

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

**`example`** <caption>Restore a viewer from `localStorage`</caption>
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

[rust/perspective-viewer/src/ts/index.ts:237](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L237)

___

### save

▸ **save**(): `Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

Serialize this element's attribute/interaction state, but _not_ the
`perspective.Table` or its `Schema`.  `save()` is designed to be used in
conjunction with `restore()` to persist user settings and bookmarks, but
the `PerspectiveViewerConfig` object returned in `json` format can also
be written by hand quite easily, which is useful for authoring
pre-conceived configs.

**`example`** <caption>Save a viewer to `localStorage`</caption>
```javascript
const viewer = document.querySelector("perspective-viewer");
const token = await viewer.save("string");
localStorage.setItem("viewer_state", token);
```

#### Returns

`Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

a serialized element in the chosen format.

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:262](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L262)

▸ **save**(`format`): `Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"json"`` |

#### Returns

`Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:263](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L263)

▸ **save**(`format`): `Promise`<`ArrayBuffer`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"arraybuffer"`` |

#### Returns

`Promise`<`ArrayBuffer`\>

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:264](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L264)

▸ **save**(`format`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"string"`` |

#### Returns

`Promise`<`string`\>

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:265](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L265)

___

## Plugin Methods

### getAllPlugins

▸ **getAllPlugins**(): `Promise`<`HTMLElement`[]\>

Get all plugin custom element instances, in order of registration.

If no plugins have been registered (via `registerPlugin()`), calling
`getAllPlugins()` will cause `perspective-viewer-debug` to be registered
as a side effect.

#### Returns

`Promise`<`HTMLElement`[]\>

An `Array` of the plugin instances for this
`<perspective-viewer>`.

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:478](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L478)

___

### getPlugin

▸ **getPlugin**(`name`): `Promise`<`HTMLElement`\>

Get the currently active plugin custom element instance, or a specific
named instance if requested.  `getPlugin(name)` does not activate the
plugin requested, so if this plugin is not active the returned
`HTMLElement` will not have a `parentElement`.

If no plugins have been registered (via `registerPlugin()`), calling
`getPlugin()` will cause `perspective-viewer-debug` to be registered as a
side effect.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `any` | Optionally a specific plugin name, defaulting to the current active plugin. |

#### Returns

`Promise`<`HTMLElement`\>

The active or requested plugin instance.

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:461](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L461)

___

### registerPlugin

▸ `Static` **registerPlugin**(`name`): `Promise`<`void`\>

Register a new plugin via its custom element name.  This method is called
automatically as a side effect of importing a plugin module, so this
method should only typically be called by plugin authors.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `any` | The `name` of the custom element to register, as supplied to the `customElements.define(name)` method. |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:123](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L123)

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

[rust/perspective-viewer/src/ts/index.ts:357](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L357)

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

[rust/perspective-viewer/src/ts/index.ts:334](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L334)

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

[rust/perspective-viewer/src/ts/index.ts:441](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L441)

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

[rust/perspective-viewer/src/ts/index.ts:322](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L322)

___

### flush

▸ **flush**(): `Promise`<`void`\>

Flush any pending modifications to this `<perspective-viewer>`.  Since
`<perspective-viewer>`'s API is almost entirely `async`, it may take
some milliseconds before any method call such as `restore()` affects
the rendered element.  If you want to make sure any invoked method which
affects the rendered has had its results rendered, call and await
`flush()`

**`example`** <caption>Flush an unawaited `restore()`</caption>
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

[rust/perspective-viewer/src/ts/index.ts:291](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L291)

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

[rust/perspective-viewer/src/ts/index.ts:397](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L397)

___

### notifyResize

▸ **notifyResize**(): `Promise`<`void`\>

Redraw this `<perspective-viewer>` and plugin when its dimensions or
visibility have been updated.  This method _must_ be called in these
cases, and will not by default respond to dimension or style changes to
its parent container.  `notifyResize()` does not recalculate the current
`View`, but all plugins will re-request the data window (which itself
may be smaller or larger due to resize).

**`example`** <caption>Bind `notfyResize()` to browser dimensions</caption>
```javascript
const viewer = document.querySelector("perspective-viewer");
window.addEventListener("resize", () => viewer.notifyResize());
```

#### Returns

`Promise`<`void`\>

A `Promise<void>` which resolves when this resize event has
finished rendering.

#### Defined in

[rust/perspective-viewer/src/ts/index.ts:173](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L173)

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

[rust/perspective-viewer/src/ts/index.ts:371](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L371)

___

### setThrottle

▸ **setThrottle**(`value?`): `Promise`<`void`\>

Determines the render throttling behavior. Can be an integer, for
millisecond window to throttle render event; or, if `undefined`,
will try to determine the optimal throttle time from this component's
render framerate.

**`example`** <caption>Limit FPS to 1 frame per second</caption>
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

[rust/perspective-viewer/src/ts/index.ts:417](https://github.com/finos/perspective/blob/4e5bed7d/rust/perspective-viewer/src/ts/index.ts#L417)


