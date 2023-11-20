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

- [IPerspectiveViewerElement](#IPerspectiveViewerElement)
- [IPerspectiveViewerPlugin](#IPerspectiveViewerPlugin)

### Type Aliases

- [PerspectiveViewerConfig](#perspectiveviewerconfig)
- [Semver](#semver)

### Variables

- [default](#default)

### Functions

- [chain](#chain)
- [cmp\_semver](#cmp_semver)
- [convert](#convert)
- [parse\_semver](#parse_semver)

## Type Aliases

### PerspectiveViewerConfig

Ƭ **PerspectiveViewerConfig**: `perspective.ViewConfig` & { `plugin?`: `string` ; `plugin_config?`: `any` ; `settings?`: `boolean`  }

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:15](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L15)

___

### Semver

Ƭ **Semver**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `build?` | { `major`: `number` ; `minor`: `number` ; `patch`: `number`  } |
| `build.major` | `number` |
| `build.minor` | `number` |
| `build.patch` | `number` |
| `major` | `number` |
| `minor` | `number` |
| `patch` | `number` |

#### Defined in

[rust/perspective-viewer/src/ts/migrate.ts:77](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/migrate.ts#L77)

## Variables

### default

• **default**: `Object`

#### Defined in

[rust/perspective-viewer/src/ts/perspective-viewer.ts:44](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/perspective-viewer.ts#L44)

## Functions

### chain

▸ **chain**(`old`, `args`, `options`): `any`

Chains functions of `args` and apply to `old`

#### Parameters

| Name | Type |
| :------ | :------ |
| `old` | `any` |
| `args` | `any` |
| `options` | `any` |

#### Returns

`any`

#### Defined in

[rust/perspective-viewer/src/ts/migrate.ts:194](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/migrate.ts#L194)

___

### cmp\_semver

▸ **cmp_semver**(`left`, `right_str`): `boolean`

Checks if left > right

#### Parameters

| Name | Type |
| :------ | :------ |
| `left` | [`Semver`](#semver) |
| `right_str` | `string` |

#### Returns

`boolean`

#### Defined in

[rust/perspective-viewer/src/ts/migrate.ts:115](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/migrate.ts#L115)

___

### convert

▸ **convert**(`old`, `options?`): `Record`<`string`, `unknown`\> \| `ArrayBuffer` \| `string`

A migration utility for `@finos/perspective-viewer` and
`@finos/perspective-workspace` persisted state objects.  If you have an
application which persists tokens returned by the `.save()` method of a
Perspective Custom Element, and you want to upgrade Perspective to the latest
version, this module is for you!  You know who you are!

Say you have a `<perspective-viewer>` Custom Element from
`@finos/perspective-viewer>=0.8.3`, and have persisted an arbitrary persistence
token object:

```javascript
const old_elem = document.querySelector("perspective-viewer");
const old_token = await old_elem.save();
```

To migrate this token to the version of `@finos/perspective-migrate` itself:

```javascript
import {convert} from "@finos/perspective-viewer`;

// ...

const new_elem = document.querySelector("perspective-viewer");
const new_token = convert(old_token);
await new_elem.restore(new_token);
```

`convert` can also be imported in node for converting persisted tokens
outside the browser.

```javascript
const {convert} = require("@finos/perspective-viewer/dist/cjs/migrate.js");
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `old` | `string` \| `ArrayBuffer` \| `Record`<`string`, `unknown`\> | the layout to convert, in `<perspective-viewer>` or `<perspective-workspace>` format. |
| `options` | `PerspectiveConvertOptions` | a `PerspectiveConvertOptions` object specifying the convert options for this call. |

#### Returns

`Record`<`string`, `unknown`\> \| `ArrayBuffer` \| `string`

a layout for either `<perspective-viewer>` or
`<perspective-workspace>`, updated to the perspective version of this
script's package.

#### Defined in

[rust/perspective-viewer/src/ts/migrate.ts:58](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/migrate.ts#L58)

___

### parse\_semver

▸ **parse_semver**(`ver`): [`Semver`](#semver)

#### Parameters

| Name | Type |
| :------ | :------ |
| `ver` | `string` |

#### Returns

[`Semver`](#semver)

#### Defined in

[rust/perspective-viewer/src/ts/migrate.ts:88](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/migrate.ts#L88)


# Interface: IPerspectiveViewerElement

The Custom Elements implementation for `<perspective-viewer>`, as well at its
API.  `PerspectiveViewerElement` should not be constructed directly (like its
parent class `HTMLElement`);  instead, use `document.createElement()` or
declare your `<perspective-viewer>` element in HTML.  Once instantiated,
`<perspective-viewer>` works just like a standard `HTMLElement`, with a few
extra perspective-specific methods.

**`Example`**

```javascript
const viewer = document.createElement("perspective-viewer");
```

**`Example`**

```javascript
document.body.innerHTML = `
    <perspective-viewer id="viewer"></perspective-viewer>
`;
const viewer = document.body.querySelector("#viewer");
```

## Hierarchy

- **`IPerspectiveViewerElement`**

  ↳ [`HTMLPerspectiveViewerElement`](#`HTMLPerspectiveViewerElement`)

## Implemented by

- [`HTMLPerspectiveViewerElement`](#`HTMLPerspectiveViewerElement`)

## Table of contents

### Data Methods

- [getTable](#gettable)
- [getView](#getview)
- [load](#load)

### Internal Methods

- [unsafeGetModel](#unsafegetmodel)

### Other Methods

- [restore](#restore)

### Persistence Methods

- [reset](#reset)
- [save](#save)

### Plugin Methods

- [getAllPlugins](#getallplugins)
- [getPlugin](#getplugin)

### UI Action Methods

- [copy](#copy)
- [download](#download)
- [toggleConfig](#toggleconfig)

### Util Methods

- [delete](#delete)
- [flush](#flush)
- [getEditPort](#geteditport)
- [getRenderStats](#getrenderstats)
- [notifyResize](#notifyresize)
- [resetThemes](#resetthemes)
- [restyleElement](#restyleelement)
- [setAutoPause](#setautopause)
- [setAutoSize](#setautosize)
- [setThrottle](#setthrottle)

## Data Methods

### getTable

▸ **getTable**(`wait_for_table?`): `Promise`<`Table`\>

Returns the `perspective.Table()` which was supplied to `load()`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait_for_table?` | `boolean` | Whether to await `load()` if it has not yet been invoked, or fail immediately. |

#### Returns

`Promise`<`Table`\>

A `Promise` which resolves to a `perspective.Table`

**`Example`**

<caption>Share a `Table`</caption>

```javascript
const viewers = document.querySelectorAll("perspective-viewer");
const [viewer1, viewer2] = Array.from(viewers);
const table = await viewer1.getTable();
await viewer2.load(table);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:176](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L176)

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

#### Returns

`Promise`<`View`\>

A `Promise` which ressolves to a `perspective.View`.

**`Example`**

<caption>Collapse grid to root</caption>

```javascript
const viewer = document.querySelector("perspective-viewer");
const view = await viewer.getView();
await view.set_depth(0);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:198](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L198)

___

### load

▸ **load**(`table`): `Promise`<`void`\>

Load a `perspective.Table`.  If `load` or `update` have already been
called on this element, its internal `perspective.Table` will _not_ be
deleted, but it will bed de-referenced by this `<perspective-viewer>`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `table` | `Table` \| `Promise`<`Table`\> |

#### Returns

`Promise`<`void`\>

A promise which resolves once the data is
loaded, a `perspective.View` has been created, and the active plugin has
rendered.

**`Example`**

<caption>Load perspective.table</caption>

```javascript
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

**`Example`**

<caption>Load Promise&lt;perspective.table&gt;</caption>

```javascript
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:98](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L98)

___

## Internal Methods

### unsafeGetModel

▸ **unsafeGetModel**(): `number`

Get the raw pointer to this `<perspective-viewer>` WASM model, such that
it may be passed back to WASM function calls that take a
`PerspectiveViewerElement` as an argument.

#### Returns

`number`

A pointer to this model

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:498](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L498)

___

## Other Methods

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

@category Persistence
@param config returned by `save()`.  This can be any format returned by
`save()`; the specific deserialization is chosen by `typeof config`.
@returns A promise which resolves when the changes have been applied and
rendered.
@example <caption>Restore a viewer from `localStorage`</caption>

```javascript
const viewer = document.querySelector("perspective-viewer");
const token = localStorage.getItem("viewer_state");
await viewer.restore(token);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `string` \| [`PerspectiveViewerConfig`](#perspectiveviewerconfig) \| `ArrayBuffer` |

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:238](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L238)

___

## Persistence Methods

### reset

▸ **reset**(`all`): `Promise`<`void`\>

Reset's this element's view state and attributes to default.  Does not
delete this element's `perspective.table` or otherwise modify the data
state.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `all` | `any` | Should `expressions` param be reset as well, defaults to |

#### Returns

`Promise`<`void`\>

**`Example`**

```javascript
const viewer = document.querySelector("perspective-viewer");
await viewer.reset();
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:306](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L306)

___

### save

▸ **save**(): `Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

Serialize this element's attribute/interaction state, but _not_ the
`perspective.Table` or its `Schema`.  `save()` is designed to be used in
conjunction with `restore()` to persist user settings and bookmarks, but
the `PerspectiveViewerConfig` object returned in `json` format can also
be written by hand quite easily, which is useful for authoring
pre-conceived configs.

#### Returns

`Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

a serialized element in the chosen format.

**`Example`**

<caption>Save a viewer to `localStorage`</caption>

```javascript
const viewer = document.querySelector("perspective-viewer");
const token = await viewer.save("string");
localStorage.setItem("viewer_state", token);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:263](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L263)

▸ **save**(`format`): `Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"json"`` |

#### Returns

`Promise`<[`PerspectiveViewerConfig`](#perspectiveviewerconfig)\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:264](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L264)

▸ **save**(`format`): `Promise`<`ArrayBuffer`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"arraybuffer"`` |

#### Returns

`Promise`<`ArrayBuffer`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:265](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L265)

▸ **save**(`format`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"string"`` |

#### Returns

`Promise`<`string`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:266](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L266)

▸ **save**(`format?`): `Promise`<`string` \| [`PerspectiveViewerConfig`](#perspectiveviewerconfig) \| `ArrayBuffer`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format?` | ``"string"`` \| ``"json"`` \| ``"arraybuffer"`` |

#### Returns

`Promise`<`string` \| [`PerspectiveViewerConfig`](#perspectiveviewerconfig) \| `ArrayBuffer`\>

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:267](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L267)

___

## Plugin Methods

### getAllPlugins

▸ **getAllPlugins**(): `HTMLElement`[]

Get all plugin custom element instances, in order of registration.

If no plugins have been registered (via `registerPlugin()`), calling
`getAllPlugins()` will cause `perspective-viewer-plugin` to be registered
as a side effect.

#### Returns

`HTMLElement`[]

An `Array` of the plugin instances for this
`<perspective-viewer>`.

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:488](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L488)

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

[rust/perspective-viewer/src/ts/viewer.ts:475](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L475)

___

## UI Action Methods

### copy

▸ **copy**(`flat`): `Promise`<`void`\>

Copies this element's view data (as a CSV) to the clipboard.  This method
must be called from an event handler, subject to the browser's
restrictions on clipboard access.  See
[https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard](https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `flat` | `boolean` | Whether to use the element's current view config, or to use a default "flat" view. |

#### Returns

`Promise`<`void`\>

**`Example`**

```javascript
const viewer = document.querySelector("perspective-viewer");
const button = document.querySelector("button");
button.addEventListener("click", async () => {
    await viewer.copy();
});
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:346](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L346)

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

[rust/perspective-viewer/src/ts/viewer.ts:326](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L326)

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

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `force?` | `boolean` | If supplied, explicitly set the config state to "open" (`true`) or "closed" (`false`). |

#### Returns

`Promise`<`void`\>

**`Example`**

```javascript
await viewer.toggleConfig();
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:458](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L458)

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

[rust/perspective-viewer/src/ts/viewer.ts:317](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L317)

___

### flush

▸ **flush**(): `Promise`<`void`\>

Flush any pending modifications to this `<perspective-viewer>`.  Since
`<perspective-viewer>`'s API is almost entirely `async`, it may take
some milliseconds before any method call such as `restore()` affects
the rendered element.  If you want to make sure any invoked method which
affects the rendered has had its results rendered, call and await
`flush()`

#### Returns

`Promise`<`void`\>

A promise which resolves when the current
pending state changes have been applied and rendered.

**`Example`**

<caption>Flush an unawaited `restore()`</caption>

```javascript
const viewer = document.querySelector("perspective-viewer");
viewer.restore({group_by: ["State"]});
await viewer.flush();
console.log("Viewer has been rendered with a pivot!");
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:291](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L291)

___

### getEditPort

▸ **getEditPort**(): `number`

Gets the edit port, the port number for which `Table` updates from this
`<perspective-viewer>` are generated.  This port number will be present
in the options object for a `View.on_update()` callback for any update
which was originated by the `<perspective-viewer>`/user, which can be
used to distinguish server-originated updates from user edits.

#### Returns

`number`

A promise which resolves to the current edit port.

**`Example`**

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

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:405](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L405)

___

### getRenderStats

▸ **getRenderStats**(): `RenderStats`

Get render statistics since the last time `getRenderStats()` was called.

#### Returns

`RenderStats`

A `RenderStats` statistics struct.

**`Example`**

```javascript
const viewer = document.querySelector("perspective-viewer");
const stats = viewer.getRenderStats();
console.log(stats.virtual_fps);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:419](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L419)

___

### notifyResize

▸ **notifyResize**(`force`): `Promise`<`void`\>

Redraw this `<perspective-viewer>` and plugin when its dimensions or
visibility has been updated.  By default, `<perspective-viewer>` will
auto-size when its own dimensions change, so this method need not be
called;  when disabled via `setAutoSize(false)` however, this method
_must_ be called, and will not respond to dimension or style changes to
its parent container otherwise.  `notifyResize()` does not recalculate
the current `View`, but all plugins will re-request the data window
(which itself may be smaller or larger due to resize).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `force` | `any` | Whether to re-render, even if the dimenions have not changed. When set to `false` and auto-size is enabled (the defaults), calling this method will automatically disable auto-size. |

#### Returns

`Promise`<`void`\>

A `Promise<void>` which resolves when this resize event has
finished rendering.

**`Example`**

<caption>Bind `notfyResize()` to browser dimensions</caption>

```javascript
const viewer = document.querySelector("perspective-viewer");
viewer.setAutoSize(false);
window.addEventListener("resize", () => viewer.notifyResize());
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:124](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L124)

___

### resetThemes

▸ **resetThemes**(`themes?`): `Promise`<`void`\>

Sets the theme names available via the `<perspective-viewer>` status bar
UI.  Typically these will be auto-detected simply by including the
theme `.css` in a `<link>` tag;  however, auto-detection can fail if
the `<link>` tag is not a same-origin request due to CORS.  For servers
configured to allow cross-origin requests, you can use the
[`crossorigin` attribute](https://html.spec.whatwg.org/multipage/semantics.html#attr-link-crossorigin)
to enable detection, e.g. `<link crossorigin="anonymous" .. >`.  If for
whatever reason auto-detection still fails, you may set the themes via
this method.  Note the theme `.css` must still be loaded in this case -
the `resetThemes()` method only lets the `<perspective-viewer>` know what
theme names are available.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `themes?` | `string`[] | A list of theme names to use, or auto-detect from document's stylesheets if `undefined`. |

#### Returns

`Promise`<`void`\>

**`Example`**

```javascript
const viewer = document.querySelector("perspective-viewer");
await viewer.resetThemes(["Pro Light", "Pro Dark"]);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:381](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L381)

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

[rust/perspective-viewer/src/ts/viewer.ts:357](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L357)

___

### setAutoPause

▸ **setAutoPause**(`autopause`): `void`

Determines the auto-pause behavior.  When `true` (default `false`), this
element will enter paused state (deleting it's `View` and ignoring
render calls) whenever it is not visible in the browser's viewport,
utilizing an `IntersectionObserver`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `autopause` | `any` | Whether to re-render when this element's dimensions change. |

#### Returns

`void`

**`Example`**

<caption>Disable auto-size</caption>

```javascript
await viewer.setAutoPause(true);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:158](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L158)

___

### setAutoSize

▸ **setAutoSize**(`autosize`): `void`

Determines the auto-size behavior.  When `true` (the default), this
element will re-render itself whenever its own dimensions change,
utilizing a `ResizeObserver`;  when `false`, you must explicitly call
`notifyResize()` when the element's dimensions have changed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `autosize` | `any` | Whether to re-render when this element's dimensions change. |

#### Returns

`void`

**`Example`**

<caption>Disable auto-size</caption>

```javascript
await viewer.setAutoSize(false);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:141](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L141)

___

### setThrottle

▸ **setThrottle**(`value?`): `void`

Determines the render throttling behavior. Can be an integer, for
millisecond window to throttle render event; or, if `undefined`,
will try to determine the optimal throttle time from this component's
render framerate.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value?` | `number` | an optional throttle rate in milliseconds (integer). If not supplied, adaptive throttling is calculated from the average plugin render time. |

#### Returns

`void`

**`Example`**

<caption>Limit FPS to 1 frame per second</caption>

```javascript
await viewer.setThrottle(1000);
```

#### Defined in

[rust/perspective-viewer/src/ts/viewer.ts:437](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/viewer.ts#L437)


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

**`Example`**

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

**`No Inherit Doc`**

## Implemented by

- [`HTMLPerspectiveViewerPluginElement`](#`HTMLPerspectiveViewerPluginElement`)

## Table of contents

### Accessors

- [config\_column\_names](#config_column_names)
- [min\_config\_columns](#min_config_columns)
- [name](#name)
- [priority](#priority)
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

[rust/perspective-viewer/src/ts/plugin.ts:82](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L82)

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

[rust/perspective-viewer/src/ts/plugin.ts:73](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L73)

___

### name

• `get` **name**(): `string`

The name for this plugin, which is used as both it's unique key for use
as a parameter for the `plugin` field of a `ViewerConfig`, and as the
display name for this plugin in the `<perspective-viewer>` UI.

#### Returns

`string`

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:54](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L54)

___

### priority

• `get` **priority**(): `number`

The load priority of the plugin. If the plugin shares priority with another,
the first to load has a higher priority.

A larger number has a higher priority.

The plugin with the highest priority will be loaded by default by the Perspective viewer.
If you would like to instead begin with a lower priority plugin, choose it explicitly with
a `HTMLPerspectiveViewerPluginElement.restore` call.

#### Returns

`number`

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:94](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L94)

___

### select\_mode

• `get` **select_mode**(): `string`

Select mode determines how column add/remove buttons behave for this
plugin.  `"select"` mode exclusively selects the added column, removing
other columns.  `"toggle"` mode toggles the column on or off (dependent
on column state), leaving existing columns alone.

#### Returns

`string`

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:62](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L62)

## Methods

### clear

▸ **clear**(): `Promise`<`void`\>

Clear this plugin, though it is up to the discretion of the plugin
author to determine what this means.  Defaults to resetting this
element's `innerHTML`, so be sure to override if you want custom
behavior.

#### Returns

`Promise`<`void`\>

**`Example`**

```javascript
async clear(): Promise<void> {
    this.innerHTML = "";
}
```

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:138](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L138)

___

### delete

▸ **delete**(): `Promise`<`void`\>

Free any resources acquired by this plugin and prepare to be deleted.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:173](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L173)

___

### draw

▸ **draw**(`view`): `Promise`<`void`\>

Render this plugin using the provided `View`.  While there is no
provision to cancel a render in progress per se, calling a method on
a `View` which has been deleted will throw an exception.

#### Parameters

| Name | Type |
| :------ | :------ |
| `view` | `View` |

#### Returns

`Promise`<`void`\>

**`Example`**

```
async draw(view: perspective.View): Promise<void> {
    const csv = await view.to_csv();
    this.innerHTML = `<pre>${csv}</pre>`;
}
```

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:109](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L109)

___

### resize

▸ **resize**(): `Promise`<`void`\>

Like `update()`, but for when the dimensions of the plugin have changed
and the underlying data has not.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:144](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L144)

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

[rust/perspective-viewer/src/ts/plugin.ts:168](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L168)

___

### restyle

▸ **restyle**(): `Promise`<`void`\>

Notify the plugin that the style environment has changed.  Useful for
plugins which read CSS styles via `window.getComputedStyle()`.

#### Returns

`Promise`<`void`\>

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:150](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L150)

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

[rust/perspective-viewer/src/ts/plugin.ts:163](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L163)

___

### update

▸ **update**(`view`): `Promise`<`void`\>

Draw under the assumption that the `ViewConfig` has not changed since
the previous call to `draw()`, but the underlying data has.  Defaults to
dispatch to `draw()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `view` | `View` |

#### Returns

`Promise`<`void`\>

**`Example`**

```javascript
async update(view: perspective.View): Promise<void> {
    return this.draw(view);
}
```

#### Defined in

[rust/perspective-viewer/src/ts/plugin.ts:123](https://github.com/finos/perspective/blob/7392c2a64/rust/perspective-viewer/src/ts/plugin.ts#L123)


