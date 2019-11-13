<a name="module_perspective-viewer"></a>

## perspective-viewer
Module for `<perspective-viewer>` custom element.  There are no exports fromthis module, however importing it has a side effect:  the[module:perspective_viewer~PerspectiveViewer](module:perspective_viewer~PerspectiveViewer) class is registered as acustom element, after which it can be used as a standard DOM element.  Thedocumentation in this module defines the instance structure of a`<perspective-viewer>` DOM object instantiated typically, through HTML or anyrelevent DOM method e.g. `document.createElement("perspective-viewer")` or`document.getElementsByTagName("perspective-viewer")`.


* [perspective-viewer](#module_perspective-viewer)
    * [~PerspectiveViewer](#module_perspective-viewer..PerspectiveViewer) ⇐ <code>HTMLElement</code>
        * [new PerspectiveViewer()](#new_module_perspective-viewer..PerspectiveViewer_new)
        * [.sort](#module_perspective-viewer..PerspectiveViewer+sort) : <code>[ &#x27;array&#x27; ].&lt;string&gt;</code>
        * [.columns](#module_perspective-viewer..PerspectiveViewer+columns)
        * [.computed-columns](#module_perspective-viewer..PerspectiveViewer+computed-columns)
        * [.aggregates](#module_perspective-viewer..PerspectiveViewer+aggregates)
        * [.filters](#module_perspective-viewer..PerspectiveViewer+filters) : <code>array</code>
        * [.plugin](#module_perspective-viewer..PerspectiveViewer+plugin) : <code>string</code>
        * [.column-pivots](#module_perspective-viewer..PerspectiveViewer+column-pivots) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
        * [.row-pivots](#module_perspective-viewer..PerspectiveViewer+row-pivots) : <code>[ &#x27;array&#x27; ].&lt;string&gt;</code>
        * [.editable](#module_perspective-viewer..PerspectiveViewer+editable) : <code>boolean</code>
        * [.worker](#module_perspective-viewer..PerspectiveViewer+worker)
        * [.table](#module_perspective-viewer..PerspectiveViewer+table)
        * [.view](#module_perspective-viewer..PerspectiveViewer+view)
        * [.load(data)](#module_perspective-viewer..PerspectiveViewer+load) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
        * [.update(data)](#module_perspective-viewer..PerspectiveViewer+update)
        * [.notifyResize()](#module_perspective-viewer..PerspectiveViewer+notifyResize)
        * [.clone(widget)](#module_perspective-viewer..PerspectiveViewer+clone)
        * [.delete(delete_table)](#module_perspective-viewer..PerspectiveViewer+delete) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;boolean&gt;</code>
        * [.restyleElement()](#module_perspective-viewer..PerspectiveViewer+restyleElement)
        * [.save()](#module_perspective-viewer..PerspectiveViewer+save) ⇒ <code>object</code>
        * [.restore(config)](#module_perspective-viewer..PerspectiveViewer+restore) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
        * [.flush()](#module_perspective-viewer..PerspectiveViewer+flush) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
        * [.clear()](#module_perspective-viewer..PerspectiveViewer+clear)
        * [.replace()](#module_perspective-viewer..PerspectiveViewer+replace)
        * [.reset()](#module_perspective-viewer..PerspectiveViewer+reset)
        * [.copy()](#module_perspective-viewer..PerspectiveViewer+copy)
        * [.toggleConfig()](#module_perspective-viewer..PerspectiveViewer+toggleConfig)


* * *

<a name="module_perspective-viewer..PerspectiveViewer"></a>

### perspective-viewer~PerspectiveViewer ⇐ <code>HTMLElement</code>
**Kind**: inner class of [<code>perspective-viewer</code>](#module_perspective-viewer)  
**Extends**: <code>HTMLElement</code>  

* [~PerspectiveViewer](#module_perspective-viewer..PerspectiveViewer) ⇐ <code>HTMLElement</code>
    * [new PerspectiveViewer()](#new_module_perspective-viewer..PerspectiveViewer_new)
    * [.sort](#module_perspective-viewer..PerspectiveViewer+sort) : <code>[ &#x27;array&#x27; ].&lt;string&gt;</code>
    * [.columns](#module_perspective-viewer..PerspectiveViewer+columns)
    * [.computed-columns](#module_perspective-viewer..PerspectiveViewer+computed-columns)
    * [.aggregates](#module_perspective-viewer..PerspectiveViewer+aggregates)
    * [.filters](#module_perspective-viewer..PerspectiveViewer+filters) : <code>array</code>
    * [.plugin](#module_perspective-viewer..PerspectiveViewer+plugin) : <code>string</code>
    * [.column-pivots](#module_perspective-viewer..PerspectiveViewer+column-pivots) : <code>[ &#x27;Array&#x27; ].&lt;String&gt;</code>
    * [.row-pivots](#module_perspective-viewer..PerspectiveViewer+row-pivots) : <code>[ &#x27;array&#x27; ].&lt;string&gt;</code>
    * [.editable](#module_perspective-viewer..PerspectiveViewer+editable) : <code>boolean</code>
    * [.worker](#module_perspective-viewer..PerspectiveViewer+worker)
    * [.table](#module_perspective-viewer..PerspectiveViewer+table)
    * [.view](#module_perspective-viewer..PerspectiveViewer+view)
    * [.load(data)](#module_perspective-viewer..PerspectiveViewer+load) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
    * [.update(data)](#module_perspective-viewer..PerspectiveViewer+update)
    * [.notifyResize()](#module_perspective-viewer..PerspectiveViewer+notifyResize)
    * [.clone(widget)](#module_perspective-viewer..PerspectiveViewer+clone)
    * [.delete(delete_table)](#module_perspective-viewer..PerspectiveViewer+delete) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;boolean&gt;</code>
    * [.restyleElement()](#module_perspective-viewer..PerspectiveViewer+restyleElement)
    * [.save()](#module_perspective-viewer..PerspectiveViewer+save) ⇒ <code>object</code>
    * [.restore(config)](#module_perspective-viewer..PerspectiveViewer+restore) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
    * [.flush()](#module_perspective-viewer..PerspectiveViewer+flush) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
    * [.clear()](#module_perspective-viewer..PerspectiveViewer+clear)
    * [.replace()](#module_perspective-viewer..PerspectiveViewer+replace)
    * [.reset()](#module_perspective-viewer..PerspectiveViewer+reset)
    * [.copy()](#module_perspective-viewer..PerspectiveViewer+copy)
    * [.toggleConfig()](#module_perspective-viewer..PerspectiveViewer+toggleConfig)


* * *

<a name="new_module_perspective-viewer..PerspectiveViewer_new"></a>

#### new PerspectiveViewer()
HTMLElement class for `<perspective-viewer>` custom element.  This class isnot exported, so this constructor cannot be invoked in the typical manner;instead, instances of the class are created through the Custom Elements DOMAPI.Properties of an instance of this class, such as [module:perspective_viewer~PerspectiveViewer#columns](module:perspective_viewer~PerspectiveViewer#columns),are reflected on the DOM element as Attributes, and should be accessed assuch - e.g. `instance.setAttribute("columns", JSON.stringify(["a", "b"]))`.

**Example**  
```js
// Create a new `<perspective-viewer>`const elem = document.createElement("perspective-viewer");elem.setAttribute("columns", JSON.stringify(["a", "b"]));document.body.appendChild(elem);
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+sort"></a>

#### perspectiveViewer.sort : <code>[ &#x27;array&#x27; ].&lt;string&gt;</code>
Sets this `perspective.table.view`'s `sort` property, an array of columnnames.

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

#### perspectiveViewer.columns
The set of visible columns.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Params**

- columns <code>array</code> - An array of strings, the names of visible columns.

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

#### perspectiveViewer.computed-columns
The set of visible columns.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Params**

- computed-columns <code>array</code> - An array of computed column objects

**Example** *(via Javascript DOM)*  
```js
let elem = document.getElementById('my_viewer');
elem.setAttribute('computed-columns', JSON.stringify([{name: "x+y", func: "add", inputs: ["x", "y"]}]));
```
**Example** *(via HTML)*  
```js
<perspective-viewer computed-columns="[{name:'x+y',func:'add',inputs:['x','y']}]""></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+aggregates"></a>

#### perspectiveViewer.aggregates
The set of column aggregate configurations.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  
**Params**

- aggregates <code>object</code> - A dictionary whose keys are column names, andvalues are valid aggregations.  The `aggergates` attribute works as anoverride;  in lieu of a key for a column supplied by the developers, adefault will be selected and reflected to the attribute based on thecolumn's type.  See [perspective/src/js/defaults.js](perspective/src/js/defaults.js)

**Example** *(via Javascript DOM)*  
```js
let elem = document.getElementById('my_viewer');
elem.setAttribute('aggregates', JSON.stringify({x: "distinct count"}));
```
**Example** *(via HTML)*  
```js
<perspective-viewer aggregates='{"x": "distinct count"}'></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+filters"></a>

#### perspectiveViewer.filters : <code>array</code>
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
<perspective-viewer filters='[["x", "<", 3], ["y", "contains", "abc"]]'></perspective-viewer>
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+plugin"></a>

#### perspectiveViewer.plugin : <code>string</code>
Sets the currently selected plugin, via its `name` field.

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

#### perspectiveViewer.row-pivots : <code>[ &#x27;array&#x27; ].&lt;string&gt;</code>
Sets this `perspective.table.view`'s `row_pivots` property.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+editable"></a>

#### perspectiveViewer.editable : <code>boolean</code>
Determines whether this viewer is editable or not (though it isultimately up to the plugin as to whether editing is implemented).

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-config-update</code>  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+worker"></a>

#### perspectiveViewer.worker
This element's `perspective` worker instance.  This property is notreflected as an HTML attribute, and is readonly;  it can be effectivelyset however by calling the `load() method with a `perspective.table`instance from the preferred worker.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Read only**: true  
**Example**  
```js
let elem = document.getElementById('my_viewer');let table = elem.worker.table([{x:1, y:2}]);elem.load(table);
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
This element's `perspective.table.view` instance.  The instance itselfwill change after every `PerspectiveViewer#perspective-config-update` event.

**Kind**: instance property of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Read only**: true  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+load"></a>

#### perspectiveViewer.load(data) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
Load data.  If `load` or `update` have already been called on thiselement, its internal `perspective.table` will also be deleted.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code> - A promise which resolves once the data isloaded and a `perspective.view` has been created.  
**Emits**: <code>module:perspective\_viewer~PerspectiveViewer#perspective-click PerspectiveViewer#event:perspective-view-update</code>  
**Params**

- data <code>any</code> - The data to load.  Works with the same input typessupported by `perspective.table`.

**Example** *(Load JSON)*  
```js
const my_viewer = document.getElementById('#my_viewer');
my_viewer.load([
    {x: 1, y: 'a'},
    {x: 2, y: 'b'}
]);
```
**Example** *(Load CSV)*  
```js
const my_viewer = document.getElementById('#my_viewer');
my_viewer.load("x,y\n1,a\n2,b");
```
**Example** *(Load perspective.table)*  
```js
const my_viewer = document.getElementById('#my_viewer');
const tbl = perspective.table("x,y\n1,a\n2,b");
my_viewer.load(tbl);
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+update"></a>

#### perspectiveViewer.update(data)
Updates this element's `perspective.table` with new data.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Emits**: <code>PerspectiveViewer#event:perspective-view-update</code>  
**Params**

- data <code>any</code> - The data to load.  Works with the same input typessupported by `perspective.table.update`.

**Example**  
```js
const my_viewer = document.getElementById('#my_viewer');my_viewer.update([    {x: 1, y: 'a'},    {x: 2, y: 'b'}]);
```

* * *

<a name="module_perspective-viewer..PerspectiveViewer+notifyResize"></a>

#### perspectiveViewer.notifyResize()
Determine whether to reflow the viewer and redraw.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+clone"></a>

#### perspectiveViewer.clone(widget)
Duplicate an existing `<perspective-element>`, including data and viewsettings.  The underlying `perspective.table` will be shared between bothelements

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Params**

- widget <code>any</code> - A `<perspective-viewer>` instance to clone.


* * *

<a name="module_perspective-viewer..PerspectiveViewer+delete"></a>

#### perspectiveViewer.delete(delete_table) ⇒ <code>[ &#x27;Promise&#x27; ].&lt;boolean&gt;</code>
Deletes this element's data and clears it's internal state (but not itsuser state).  This (or the underlying `perspective.table`'s equivalentmethod) must be called in order for its memory to be reclaimed.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;boolean&gt;</code> - Whether or not this call resulted in theunderlying `perspective.table` actually being deleted.  
**Params**

- delete_table <code>boolean</code> <code> = true</code> - Should a delete call also be made to theunderlying `table()`.


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
Restore this element to a state as generated by a reciprocal call to`save` or `serialize`.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code> - A promise which resolves when the changes havebeen applied.  
**Params**

- config <code>object</code> | <code>string</code> - returned by `save` or `serialize`.


* * *

<a name="module_perspective-viewer..PerspectiveViewer+flush"></a>

#### perspectiveViewer.flush() ⇒ <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code>
Flush any pending attribute modifications to this element.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  
**Returns**: <code>[ &#x27;Promise&#x27; ].&lt;void&gt;</code> - A promise which resolves when the currentattribute state has been applied.  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+clear"></a>

#### perspectiveViewer.clear()
Clears the rows in the current [table](table).

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+replace"></a>

#### perspectiveViewer.replace()
Replaces all rows in the current [table](table).

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+reset"></a>

#### perspectiveViewer.reset()
Reset's this element's view state and attributes to default.  Does notdelete this element's `perspective.table` or otherwise modify the datastate.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+copy"></a>

#### perspectiveViewer.copy()
Copies this element's view data (as a CSV) to the clipboard.  This methodmust be called from an event handler, subject to the browser'srestrictions on clipboard access.  See[https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard](https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard).

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

<a name="module_perspective-viewer..PerspectiveViewer+toggleConfig"></a>

#### perspectiveViewer.toggleConfig()
Opens/closes the element's config menu.

**Kind**: instance method of [<code>PerspectiveViewer</code>](#module_perspective-viewer..PerspectiveViewer)  

* * *

