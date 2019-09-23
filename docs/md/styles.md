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
|`color`<br/>`--hypergrid--color`<br/>`--`_TYPE_`--hypergrid--color`|The primary text and interface color.|
|`background`<br/>`--hypergrid--background`|For the element, e.g. the control panel `background`|
|`font-family`<br/>`--hypergrid--font-family`<br/>`--`_TYPE_`--hypergrid--font-family`|The default `font-family`.|
|`font-size`<br/>`--hypergrid--font-size`<br/>`--`_TYPE_`--hypergrid--font-size`|The default `font-size`.|

|`--column-type--content`<br/>`--`TYPE`--column-type--content`|`content` property of the Column type badge ("abc", "123", etc in default)|

|`--hypergrid--width`<br/>`--`_TYPE_`--hypergrid--width`|Initial column width|
|`--hypergrid--max-width`<br/>`--`_TYPE_`--hypergrid--max-width`|Max column width|
|`--hypergrid--min-width`<br/>`--`_TYPE_`--hypergrid--min-width`|Min column width|
|`--hypergrid-row-hover--background`|Row background on hover (additive)|
|`--hypergrid-cell-hover--background`|Column background on hover (additive)|
|`--hypergrid-positive--color`<br/>`--`_TYPE_`--hypergrid-positive--color`|Foreground color for (+)|
|`--hypergrid-negative--color`<br/>`--`_TYPE_`--hypergrid-negative--color`|Foreground color for (-)|

|`--d3fc-full--gradient`<br/>`--highcharts-full--gradient`|The color gradient for [-, +] ranges on numeric columns.|
|`--d3fc-positive--gradient`<br/>`--highcharts-positive--gradient`|The color gradient for [+, +] ranges on numeric columns.|
|`--d3fc-negative--gradient`<br/>`--highcharts-negative--gradient`|The color gradient for [-, -] ranges on numeric columns.|

