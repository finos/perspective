# Changelog

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
