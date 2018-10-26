# Changelog

## [0.2.3] - 2018-10-25
### Added
* [#286](https://github.com/jpmorganchase/perspective/pull/286) Ported `<perspective-viewer>` to utilize Shadow DOM.
* [#271](https://github.com/jpmorganchase/perspective/pull/271) Added support for `date` type in addition to `datetime` (formerly `date`).  `date`s can be specified in a `schema` or inferred from inputs.
* [#273](https://github.com/jpmorganchase/perspective/pull/273) Added `col_to_js_typed_array` method to `view()`.
* [#284](https://github.com/jpmorganchase/perspective/pull/284) Updated Jupyterlab support to 0.35.x
* [#287](https://github.com/jpmorganchase/perspective/pull/287) `restore()` is now a `Promise`.
  
### Fixes
* [#280](https://github.com/jpmorganchase/perspective/pull/280) Fixed pivotting on columns with `null` values.
* [#288](https://github.com/jpmorganchase/perspective/pull/288) Fixed issue which caused Hypergrid plugin to fail on empty or `schema` only data.
* [#289](https://github.com/jpmorganchase/perspective/pull/289) Fixed issue which caused one-sided charts to not update when their axes grew.
* [#283](https://github.com/jpmorganchase/perspective/pull/283) Fixed multiple computed column UX issues.
* [#274](https://github.com/jpmorganchase/perspective/pull/274) Fixed delta updates to support computed columns.
* [#279](https://github.com/jpmorganchase/perspective/pull/279) Fixed Typescript types for `update` and `view` methods.
* [#277](https://github.com/jpmorganchase/perspective/pull/277) Fixed row-expansion to work correctly with updates, and modified semantics for expand-to-depth.

## [0.2.2] - 2018-10-08
### Added
* Hypergrid foreground color, background color, font, and positive/negative variations are styleable via CSS.
* "not in" filter type added.
* `<perspective-viewer>` `load()` method takes the same options objects as `table()`.
* `perspective` library classes now bind their methods to their class instances.
* New CLI example project.
* New Citibike live examples.
* Added support for chunked Arrows.
* Added support/proper errors for un-decodeable strings.
  
### Fixes
* Fixed a bug which de-registered updates when a computed column was added.
* Fixed source-maps for Web Workers.
* Fixed aggregate bug which caused partial updates without aggregate to incorrectly apply to aggregate.
* Fixed flapping tooltip test #210.
* Fixed CSS regression in Chrome Canary 71.
