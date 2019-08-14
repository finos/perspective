---
id: styles
title: CSS Styles
---

# CSS Styles

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

In addition to the [custom rules](styles) supported, `<perspective-viewer>` can be
further styled by column type for certain parameters (where noted), and even
by [custom defined types]().

```css
perspective-viewer {

    /* Set the color */
    color: #ff0000;   

    /* Override the color for hypergrid */
    --hypergrid--color: #00ff00; 

    /* Override the color for "integer" columns in Hypergrid */
    --integer--hypergrid--color: #0000ff; 

    /* Override the color for "price" (defined in `perspective.config.js`)
       columns in Hypergrid */
    --price--hypergrid--color: #000000; 
}
```

# Supported rules

|||
|:--|:--|
|`color`<br/>`--hypergrid--color`<br/>`--`TYPE`--hypergrid--color`|The primary text and interface color.|
|`background`|For the element, e.g. the control panel `background`|
|`background-color`|For the element, e.g. the control panel `background-color`|
|`font-family`<br/>`--hypergrid--font-family`<br/>`--`TYPE`--hypergrid--font-family`|The default `font-family`.|
|`font-size`<br/>`--hypergrid--font-size`<br/>`--`TYPE`--hypergrid--font-size`|The default `font-size`.|
|`--hypergrid--font-size`<br/>`--`TYPE`--hypergrid--font-size`|The default `font-size`.|
|`--d3fc-gradient-full`<br/>`--highcharts-gradient-full`|The color gradient for [-, +] ranges on numeric columns.|
|`--d3fc-gradient-positive`<br/>`--highcharts-gradient-positive`|The color gradient for [+, +] ranges on numeric columns.|
|`--d3fc-gradient-negative`<br/>`--highcharts-gradient-negative`|The color gradient for [-, -] ranges on numeric columns.|

