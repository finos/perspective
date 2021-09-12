---
id: styles
title: CSS Styles
---

The `<perspective-viewer>` custom element supports a variety of styling options
via custom CSS rules, which can be used almost exactly like traditional CSS.
Note that it may be necessary to invoke `restyleElement()` on the custom element
itself before updated CSS rules may apply, if those rules affect canvas-rendered
elements such as the `@finos/perspective-viewer-hypergrid` plugin.

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];
elem.style.color = "#ff0000";
elem.restyleElement();
```

**_ Under Construction _**
