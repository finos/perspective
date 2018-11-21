# Changelog

## [0.2.8] - 2018-11-21
### Added
* [#317](https://github.com/jpmorganchase/perspective/pull/317) Applying 'column-pivots' now preserves the sort order.
* [#319](https://github.com/jpmorganchase/perspective/pull/319) Sorting by a column in 'column-pivots' will apply the sort to column order.

### Fixes
* [#306](https://github.com/jpmorganchase/perspective/pull/306) Fixed Jupyterlab plugin, updating it to work with the newest [perspective-python 0.1.1](https://github.com/timkpaine/perspective-python/tree/v0.1.1).

## [0.2.7] - 2018-11-12
### Fixes
* [#304](https://github.com/jpmorganchase/perspective/pull/304) Fixed missing file in NPM package.

## [0.2.6] - 2018-11-12
### Fixes
* [#303](https://github.com/jpmorganchase/perspective/pull/303) Fixed `webpack-plugin` babel-loader configuration issue.

## [0.2.5] - 2018-11-09
### Fixes
* [#301](https://github.com/jpmorganchase/perspective/pull/301) Fixed missing `webpack-plugin` export and `babel-polyfill` import.

## [0.2.4] - 2018-11-08
### Added
* [#299](https://github.com/jpmorganchase/perspective/pull/299) Added a new Menu bar (accessible via right-click on the config button) for `reset`, `copy` and `download` actions, and an API for `download()` (`copy()` and `reset()` already exist).
* [#295](https://github.com/jpmorganchase/perspective/pull/295) `@jpmorganchase/perspective` now exports `wepback-plugin` for easy integration with WebPack, [example](https://github.com/jpmorganchase/perspective/blob/master/examples/webpack/webpack.config.js).  Webpacked builds are overall smaller as well. 
* [#290](https://github.com/jpmorganchase/perspective/pull/290) Large aggregate datasets now trigger a render warning before attempting to render.

### Fixes
* [#298](https://github.com/jpmorganchase/perspective/pull/298) Fixed Material dark theming readbility for hovers and dropdowns.

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
