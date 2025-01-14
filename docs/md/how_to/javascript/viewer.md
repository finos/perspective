# `<perspective-viewer>` Custom Element library

`<perspective-viewer>` provides a complete graphical UI for configuring the
`perspective` library and formatting its output to the provided visualization
plugins.

Once imported and initialized in JavaScript, the `<perspective-viewer>` Web
Component will be available in any standard HTML on your site. A simple example:

```html
<perspective-viewer id="view1"></perspective-viewer>
<script type="module">
    const viewer = document.createElement("perspective-viewer");
    await viewer.load(table);
</script>
```
