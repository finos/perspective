<a name="module_perspective-viewer"></a>

## perspective-viewer
Module for the `<perspective-viewer>` custom element.

This module has no exports, but importing it has a side
effect: the [module:perspective_viewer~PerspectiveViewer](module:perspective_viewer~PerspectiveViewer) class is
registered as a custom element, after which it can be used as a standard DOM
element.

The documentation in this module defines the instance structure of a
`<perspective-viewer>` DOM object instantiated typically, through HTML or any
relevent DOM method e.g. `document.createElement("perspective-viewer")` or
`document.getElementsByTagName("perspective-viewer")`.


* [perspective-viewer](#module_perspective-viewer)
    * [~PerspectiveViewer](#module_perspective-viewer..PerspectiveViewer) ⇐ <code>HTMLElement</code>
        * [new PerspectiveViewer()](#new_module_perspective-viewer..PerspectiveViewer_new)
        * [.sort](#module_perspective-viewer..PerspectiveViewer+sort) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
        * [.columns](#module_perspective-viewer..PerspectiveViewer+columns) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
        * <del>[.computed-columns](#module_perspective-viewer..PerspectiveViewer+computed-columns) : <code>[ &#x27;Array&#x27; ].&lt;Object&gt;</code></del>
        * [.expressions](#module_perspective-viewer..PerspectiveViewer+expressions) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
        * [.aggregates](#module_perspective-viewer..PerspectiveViewer+aggregates) : <code>Object</code>
        * [.filters](#module_perspective-viewer..PerspectiveViewer+filters) : <code>[ &#x27;Array&#x27; ].&lt;Array&gt;</code>
        * [.plugin](#module_perspective-viewer..PerspectiveViewer+plugin) : <code>String</code>
        * [.column-pivots](#module_perspective-viewer..PerspectiveViewer+column-pivots) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
        * [.row-pivots](#module_perspective-viewer..PerspectiveViewer+row-pivots) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
        * [.editable](#module_perspective-viewer..PerspectiveViewer+editable) : <code>Boolean</code>
        * [.throttle](#module_perspective-viewer..PerspectiveViewer+throttle) : <code>Number</code> \| <code>String</code>
        * [.table](#module_perspective-viewer..PerspectiveViewer+table)
        * [.view](#module_perspective-viewer..PerspectiveViewer+view)
        * [.load(data)](#module_perspective-viewer..PerspectiveViewer+load) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
        * [.notifyResize()](#module_perspective-viewer..PerspectiveViewer+notifyResize)
        * [.clone(widget)](#module_perspective-viewer..PerspectiveViewer+clone)
        * [.delete()](#module_perspective-viewer..PerspectiveViewer+delete) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;Boolean&gt;</code>
        * [.restyleElement()](#module_perspective-viewer..PerspectiveViewer+restyleElement)
        * [.save()](#module_perspective-viewer..PerspectiveViewer+save) ⇒ <code>object</code>
        * [.restore(config)](#module_perspective-viewer..PerspectiveViewer+restore) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
        * [.flush()](#module_perspective-viewer..PerspectiveViewer+flush) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
        * [.reset()](#module_perspective-viewer..PerspectiveViewer+reset)
        * [.copy()](#module_perspective-viewer..PerspectiveViewer+copy)
        * [.toggleConfig()](#module_perspective-viewer..PerspectiveViewer+toggleConfig)
        * [.getEditPort()](#module_perspective-viewer..PerspectiveViewer+getEditPort)


* * *

<a name="module_perspective-viewer..PerspectiveViewer"></a>

### perspective-viewer~PerspectiveViewer ⇐ <code>HTMLElement</code>
**Kind**: inner class of [<code>perspective-viewer</code>](#module_perspective-viewer)  
**Extends**: <code>HTMLElement</code>  

* [~PerspectiveViewer](#module_perspective-viewer..PerspectiveViewer) ⇐ <code>HTMLElement</code>
    * [new PerspectiveViewer()](#new_module_perspective-viewer..PerspectiveViewer_new)
    * [.sort](#module_perspective-viewer..PerspectiveViewer+sort) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
    * [.columns](#module_perspective-viewer..PerspectiveViewer+columns) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
    * <del>[.computed-columns](#module_perspective-viewer..PerspectiveViewer+computed-columns) : <code>[ &#x27;Array&#x27; ].&lt;Object&gt;</code></del>
    * [.expressions](#module_perspective-viewer..PerspectiveViewer+expressions) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
    * [.aggregates](#module_perspective-viewer..PerspectiveViewer+aggregates) : <code>Object</code>
    * [.filters](#module_perspective-viewer..PerspectiveViewer+filters) : <code>[ &#x27;Array&#x27; ].&lt;Array&gt;</code>
    * [.plugin](#module_perspective-viewer..PerspectiveViewer+plugin) : <code>String</code>
    * [.column-pivots](#module_perspective-viewer..PerspectiveViewer+column-pivots) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
    * [.row-pivots](#module_perspective-viewer..PerspectiveViewer+row-pivots) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
    * [.editable](#module_perspective-viewer..PerspectiveViewer+editable) : <code>Boolean</code>
    * [.throttle](#module_perspective-viewer..PerspectiveViewer+throttle) : <code>Number</code> \| <code>String</code>
    * [.table](#module_perspective-viewer..PerspectiveViewer+table)
    * [.view](#module_perspective-viewer..PerspectiveViewer+view)
    * [.load(data)](#module_perspective-viewer..PerspectiveViewer+load) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
    * [.notifyResize()](#module_perspective-viewer..PerspectiveViewer+notifyResize)
    * [.clone(widget)](#module_perspective-viewer..PerspectiveViewer+clone)
    * [.delete()](#module_perspective-viewer..PerspectiveViewer+delete) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;Boolean&gt;</code>
    * [.restyleElement()](#module_perspective-viewer..PerspectiveViewer+restyleElement)
    * [.save()](#module_perspective-viewer..PerspectiveViewer+save) ⇒ <code>object</code>
    * [.restore(config)](#module_perspective-viewer..PerspectiveViewer+restore) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
    * [.flush()](#module_perspective-viewer..PerspectiveViewer+flush) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
    * [.reset()](#module_perspective-viewer..PerspectiveViewer+reset)
    * [.copy()](#module_perspective-viewer..PerspectiveViewer+copy)
    * [.toggleConfig()](#module_perspective-viewer..PerspectiveViewer+toggleConfig)
    * [.getEditPort()](#module_perspective-viewer..PerspectiveViewer+getEditPort)


* * *

<a name="new_module_perspective-viewer..PerspectiveViewer_new"></a>

#### new PerspectiveViewer()
The HTMLElement class for `<perspective-viewer>` custom element.

This class is not exported, so this constructor cannot be invoked in the
typical manner; instead, instances of the class are created through the
Custom Elements DOM API.

Properties of an instance of this class, such as
[module:perspective_viewer~PerspectiveViewer#columns](module:perspective_viewer~PerspectiveViewer#columns), are reflected on
the DOM element as Attributes, and should be accessed as such - e.g.
`instance.setAttribute("columns", JSON.stringify(["a", "b"]))`.

**Example**  
```js
// Create a new `<perspective-viewer>`
const elem = document.createElement("perspective-viewer");
elem.setAttribute("columns", JSON.stringify(["a", "b"]));
document.body.appendChild(elem);
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+sort"></a>

#### perspectiveViewer.sort : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
Sets this `perspective.table.view`'s `sort` property, an Array of column
names.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Example** *(via Javascript DOM)*  
```js
let elem = document.getElementById('my_viewer');
elem.setAttribute('sort', JSON.stringify([["x","desc"]));
```
**Example** *(via HTML)*  
```js
<perspective-viewer sort='[["x","desc"]]'></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+columns"></a>

#### perspectiveViewer.columns : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
The set of visible columns.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Params**

- columns <code>Array</code> - An Array of strings, the names of visible columns.

**Example** *(via Javascript DOM)*  
```js
let elem = document.getElementById('my_viewer');
elem.setAttribute('columns', JSON.stringify(["x", "y'"]));
```
**Example** *(via HTML)*  
```js
<perspective-viewer columns='["x", "y"]'></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+computed-columns"></a>

#### <del>perspectiveViewer.computed-columns : <code>[ &#x27;Array&#x27; ].&lt;Object&gt;</code></del>
***Deprecated***

DEPRECATED: use the expressions API instead.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Params**

- computed-columns <code>[ &#x27;Array&#x27; ].&lt;Object&gt;</code> - DEPRECATED - use the
"expressions" API instead.


* * *

<a name="module_perspective-viewer..PerspectiveViewer+expressions"></a>

#### perspectiveViewer.expressions : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
Sets this `perspective.table.view`'s `expressions` property, which will
output new columns from the given expressions.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Params**

- expressions <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code> - An array of string expressions to
be calculated by Perspective.

**Example** *(via Javascript DOM)*  
```js
let elem = document.getElementById('my_viewer');
elem.setAttribute('expressions', JSON.stringify(['"x" + ("y" + 20)']));
```
**Example** *(via HTML)*  
```js
<perspective-viewer expressions='[\'"x" + 10\']'></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+aggregates"></a>

#### perspectiveViewer.aggregates : <code>Object</code>
The set of column aggregate configurations.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Params**

- aggregates <code>Object</code> - A dictionary whose keys are column names, and
values are valid aggregations. The `aggregates` attribute works as an
override; in lieu of a key for a column supplied by the developers, a
default will be selected and reflected to the attribute based on the
column's type.  See [perspective/src/js/defaults.js](perspective/src/js/defaults.js)

**Example** *(via Javascript DOM)*  
```js
let elem = document.getElementById('my_viewer');
elem.setAttribute('aggregates', JSON.stringify({x: "distinct count"}));
```
**Example** *(via HTML)*  
```js
<perspective-viewer aggregates='{"x": "distinct count"}'>
</perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+filters"></a>

#### perspectiveViewer.filters : <code>[ &#x27;Array&#x27; ].&lt;Array&gt;</code>
The set of column filter configurations.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Example** *(via Javascript DOM)*  
```js
let filters = [
    ["x", "<", 3],
    ["y", "contains", "abc"]
];
let elem = document.getElementById('my_viewer');
elem.setAttribute('filters', JSON.stringify(filters));
```
**Example** *(via HTML)*  
```js
<perspective-viewer filters='[["x", "<", 3], ["y", "contains", "abc"]]'>
</perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+plugin"></a>

#### perspectiveViewer.plugin : <code>String</code>
Sets the currently selected plugin, via its `name` field, and removes
any children the previous plugin may have left behind in the light DOM.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+column-pivots"></a>

#### perspectiveViewer.column-pivots : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
Sets this `perspective.table.view`'s `column_pivots` property.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+row-pivots"></a>

#### perspectiveViewer.row-pivots : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
Sets this `perspective.table.view`'s `row_pivots` property.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+editable"></a>

#### perspectiveViewer.editable : <code>Boolean</code>
Determines whether this viewer is editable or not (though it is
ultimately up to the plugin as to whether editing is implemented).

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+throttle"></a>

#### perspectiveViewer.throttle : <code>Number</code> \| <code>String</code>
Determines the render throttling behavior. Can be an integer, for
millisecond window to throttle render event; or, if `undefined`,
will try to determine the optimal throttle time from this component's
render framerate.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Example**  
```js
<!-- Only draws at most 1 frame/sec. -->
<perspective-viewer throttle="1000"></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+table"></a>

#### perspectiveViewer.table
This element's `perspective.table` instance.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Read only**: true  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+view"></a>

#### perspectiveViewer.view
This element's `perspective.table.view` instance. The instance itself
will change after every `PerspectiveViewer#perspective-config-update`
event.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Read only**: true  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+load"></a>

#### perspectiveViewer.load(data) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
Load data. If `load` or `update` have already been called on this
element, its internal `perspective.table` will also be deleted.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code> - A promise which resolves once the data is loaded
and a `perspective.view` has been created.  
**Emits**: <code>module:perspective\_viewer~PerspectiveViewer#perspective-click
PerspectiveViewer#perspective-view-update
]);event:</code>  
**Params**

- data <code>any</code> - The data to load, as a `perspective.Table` or
`Promise<perspective.Table>`.

**Example** *(Load perspective.table)*  
```js
const my_viewer = document.getElementById('#my_viewer');
const tbl = await perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```
**Example** *(Load Promise&lt;perspective.table&gt;)*  
```js
const my_viewer = document.getElementById('#my_viewer');
const tbl = async () => perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+notifyResize"></a>

#### perspectiveViewer.notifyResize()
Determine whether to reflow the viewer and redraw.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+clone"></a>

#### perspectiveViewer.clone(widget)
Duplicate an existing `<perspective-element>`, including data and view
settings.  The underlying `perspective.table` will be shared between both
elements

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Params**

- widget <code>any</code> - A `<perspective-viewer>` instance to clone.


* * *

<a name="module_perspective-viewer..PerspectiveViewer+delete"></a>

#### perspectiveViewer.delete() ⇒ <code>[ &#x27;Promise&#x27; ].&lt;Boolean&gt;</code>
Deletes this element and clears it's internal state (but not its
user state).  This (or the underlying `perspective.view`'s equivalent
method) must be called in order for its memory to be reclaimed, as well
as the reciprocal method on the `perspective.table` which this viewer is
bound to.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;Boolean&gt;</code> - Whether or not this call resulted in the
underlying `perspective.table` actually being deleted.  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+restyleElement"></a>

#### perspectiveViewer.restyleElement()
Restyles the elements and to pick up any style changes

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+save"></a>

#### perspectiveViewer.save() ⇒ <code>object</code>
Serialize this element's attribute/interaction state.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>object</code> - a serialized element.  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+restore"></a>

#### perspectiveViewer.restore(config) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
Restore this element to a state as generated by a reciprocal call to
`save` or `serialize`.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code> - A promise which resolves when the changes have
been applied.  
**Params**

- config <code>Object</code> | <code>String</code> - returned by `save` or `serialize`.


* * *

<a name="module_perspective-viewer..PerspectiveViewer+flush"></a>

#### perspectiveViewer.flush() ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
Flush any pending attribute modifications to this element.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code> - A promise which resolves when the current
attribute state has been applied.  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+reset"></a>

#### perspectiveViewer.reset()
Reset's this element's view state and attributes to default.  Does not
delete this element's `perspective.table` or otherwise modify the data
state.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+copy"></a>

#### perspectiveViewer.copy()
Copies this element's view data (as a CSV) to the clipboard.  This method
must be called from an event handler, subject to the browser's
restrictions on clipboard access.  See
[https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard](https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard).

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+toggleConfig"></a>

#### perspectiveViewer.toggleConfig()
Opens/closes the element's config menu.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+getEditPort"></a>

#### perspectiveViewer.getEditPort()
Returns a promise that resolves to the element's edit port ID, used
internally when edits are made using DataGrid.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

