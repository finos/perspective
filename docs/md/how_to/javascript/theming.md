# Theming

Theming is supported in `perspective-viewer` and its accompanying plugins. A
number of themes come bundled with `perspective-viewer`; you can import any of
these themes directly into your app, and the `perspective-viewer`s will be
themed accordingly:

```javascript
// Themes based on Thought Merchants's Prospective design
import "@finos/perspective-viewer/dist/css/pro.css";
import "@finos/perspective-viewer/dist/css/pro-dark.css";

// Other themes
import "@finos/perspective-viewer/dist/css/solarized.css";
import "@finos/perspective-viewer/dist/css/solarized-dark.css";
import "@finos/perspective-viewer/dist/css/monokai.css";
import "@finos/perspective-viewer/dist/css/vaporwave.css";
```

Alternatively, you may use `themes.css`, which bundles all default themes

```javascript
import "@finos/perspective-viewer/dist/css/themes.css";
```

If you choose not to bundle the themes yourself, they are available through
[CDN](https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/). These
can be directly linked in your HTML file:

```html
<link
    rel="stylesheet"
    crossorigin="anonymous"
    href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/pro.css"
/>
```

Note the `crossorigin="anonymous"` attribute. When including a theme from a
cross-origin context, this attribute may be required to allow
`<perspective-viewer>` to detect the theme. If this fails, additional themes are
added to the `document` after `<perspective-viewer>` init, or for any other
reason theme auto-detection fails, you may manually inform
`<perspective-viewer>` of the available theme names with the `.resetThemes()`
method.

```javascript
// re-auto-detect themes
viewer.resetThemes();

// Set available themes explicitly (they still must be imported as CSS!)
viewer.resetThemes(["Pro Light", "Pro Dark"]);
```

`<perspective-viewer>` will default to the first loaded theme when initialized.
You may override this via `.restore()`, or provide an initial theme by setting
the `theme` attribute:

```html
<perspective-viewer theme="Pro Light"></perspective-viewer>
```

or

```javascript
const viewer = document.querySelector("perspective-viewer");
await viewer.restore({ theme: "Pro Dark" });
```
