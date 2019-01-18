# Changelog

## [0.2.12] - 2019-01-18
### Added
* [#356](https://github.com/jpmorganchase/perspective/pull/356) Perspective for Python!
* [#381](https://github.com/jpmorganchase/perspective/pull/381) Perspective for C++ Linux, MacOS and Windows!
* [#375](https://github.com/jpmorganchase/perspective/pull/375) Filter validation UX for `<perspective-viewer>`.

### Fixes
* [#353](https://github.com/jpmorganchase/perspective/pull/353) Substantial performance improvements for CSV/JSON data loading.
* [#355](https://github.com/jpmorganchase/perspective/pull/355) Reduced asset size & removed unnecesary abstraction.
* [#357](https://github.com/jpmorganchase/perspective/pull/357) Removed regenerator plugin for smaller bundle & better performance.
* [#359](https://github.com/jpmorganchase/perspective/pull/359) Added missing package.json dependencies.
* [#367](https://github.com/jpmorganchase/perspective/pull/367) Performance optimization for parsing int/float ambiguous columns.
* [#370](https://github.com/jpmorganchase/perspective/pull/370) Fixed regression in inferrence for numeric columns.
    
### Internal
* [#351](https://github.com/jpmorganchase/perspective/pull/351) Test coverage for Jupyterlab plugin.
* [#352](https://github.com/jpmorganchase/perspective/pull/352) JS data parsing API ported to C++ for portability.
* [#383](https://github.com/jpmorganchase/perspective/pull/383) Tests for C++.
* [#386](https://github.com/jpmorganchase/perspective/pull/386) Strict builds for C++

## [0.2.11] - 2018-12-20
### Added
* [#345](https://github.com/jpmorganchase/perspective/pull/345) Direct load Apache Arrow support added to Jupyterlab plugin

### Fixes
* [#343](https://github.com/jpmorganchase/perspective/pull/343) Fixed regression in type inference for empty string columns
* [#344](https://github.com/jpmorganchase/perspective/pull/344) Fixed UI lock when invalid filters applied

### Internal
* [#350](https://github.com/jpmorganchase/perspective/pull/350) New benchmark suite

## [0.2.10] - 2018-12-09
### Fixes
* [#328](https://github.com/jpmorganchase/perspective/pull/328) Fixed `<perspective-viewer>` `delete()` method memory leak.
* [#338](https://github.com/jpmorganchase/perspective/pull/338) Fixed UI interaction quirks.

### Internal
* [#337](https://github.com/jpmorganchase/perspective/pull/337) Test suite performance improvements, supports `-t` and `--saturate` flags.

## [0.2.9] - 2018-11-25
### Added
* [#325](https://github.com/jpmorganchase/perspective/pull/325) API and UX for column sorting on arbitrary columns.
* [#326](https://github.com/jpmorganchase/perspective/pull/326) Fun animations!
* [#327](https://github.com/jpmorganchase/perspective/pull/327) Render warnings show dataset size.

### Internal
* [#320](https://github.com/jpmorganchase/perspective/pull/320) Switched to `yarn`.

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
