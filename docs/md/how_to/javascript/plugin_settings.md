# Plugin render limits

`<perspective-viewer>` plugins (especially charts) may in some cases generate
extremely large output which may lock up the browser. In order to prevent
accidents (which generally require a browser refresh to fix), each plugin has a
`max_cells` and `max_columns` heuristic which requires the user to opt-in to
fully rendering `View`s which exceed these limits. To over ride this behavior,
must set these values for each plugin type individually, _before_ calling
`HTMLPerspectiveViewerElement::restore` (with the respective `plugin` name).

If you have a `<perspective-viewer>` instance, you can set these properties via
iterating over the plugins returned by the
`HTMLPerspectiveViewerElement::getAllPlugins` method:

```javascript
const viewer = document.querySelector("perspective-viewer");
for (const plugin of await viewer.getAllPlugins()) {
    if (plugin.name === "Treemap") {
        // Sets all treemap `max_cells`, not just this instance!
        plugin.max_cells = 1_000_000;
        plugin.max_columns = 1000;
    }
}
```

... Or alternatively, you can look up the Custom Element classes and set the
static variants if you know the element name (you can e.g. look this up in your
browser's DOM inspector):

```javascript
const plugin = customElements.get("perspective-viewer-d3fc-treemap");
plugin.max_cells = 1_000_000;
plugin.max_columns = 1000;
```

<div class="warning">
This distinction is just for syntax aesthetics - both methods will apply to all
instances, regardless of set via an instance, or the class itself.
</div>
