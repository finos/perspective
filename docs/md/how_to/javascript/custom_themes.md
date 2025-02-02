# Custom themes

The best way to write a new theme is to
[fork and modify an existing theme](https://github.com/finos/perspective/tree/master/rust/perspective-viewer/src/themes),
which are _just_ collections of regular CSS variables (no preprocessor is
required, though Perspective's own themes use one). `<perspective-viewer>` is
not "themed" by default and will lack icons and label text in addition to colors
and fonts, so starting from an empty theme forces you to define _every_
theme-able variable to get a functional UI.

### Icons and Translation

UI icons are defined by CSS variables provided by
[`@finos/perspective-viewer/dist/css/icons.css`](https://github.com/finos/perspective/blob/master/rust/perspective-viewer/src/themes/icons.less).
These variables must be defined for the UI icons to work - there are no default
icons without a theme.

UI text is also defined in CSS variables provided by
[`@finos/perspective-viewer/dist/css/intl.css`](https://github.com/finos/perspective/blob/master/rust/perspective-viewer/src/themes/intl.less),
and has identical import requirements. Some _example definitions_
(automatically-translated sans-editing) can be found
[`@finos/perspective-viewer/dist/css/intl/` folder](https://github.com/finos/perspective/tree/master/rust/perspective-viewer/src/themes/intl).

Importing the pre-built `themes.css` stylesheet as well as a custom theme will
define Icons and Translation globally as a side-effect. You can still customize
icons in this mode with rules (of the appropriate specificity), _but_ if you do
not still remember to define these variables yourself, your theme will not work
without the base `themes.css` pacage available.
