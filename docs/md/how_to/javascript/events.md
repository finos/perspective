# Listening for events

The `<perspective-viewer>` Custom Element fires all the same HTML `Event`s that
standard DOM `HTMLElement` objects fire, in addition to a few custom
`CustomEvent`s which relate to UI updates including those initiaed through user
interaction.

## Update events

Whenever a `<perspective-viewer>`s underlying `table()` is changed via the
`load()` or `update()` methods, a `perspective-view-update` DOM event is fired.
Similarly, `view()` updates instigated either through the Attribute API or
through user interaction will fire a `perspective-config-update` event:

```javascript
elem.addEventListener("perspective-config-update", function (event) {
    var config = elem.save();
    console.log("The view() config has changed to " + JSON.stringify(config));
});
```

## Click events

Whenever a `<perspective-viewer>`'s grid or chart is clicked, a
`perspective-click` DOM event is fired containing a detail object with `config`,
`column_names`, and `row`.

The `config` object contains an array of `filters` that can be applied to a
`<perspective-viewer>` through the use of `restore()` updating it to show the
filtered subset of data.

The `column_names` property contains an array of matching columns, and the `row`
property returns the associated row data.

```javascript
elem.addEventListener("perspective-click", function (event) {
    var config = event.detail.config;
    elem.restore(config);
});
```
