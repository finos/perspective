# Changelog

## [0.5.1] (2020-06-24)

#### Added
  * [#1090](https://github.com/finos/perspective/pull/1090) Computed expressions respect left-to-right associativity and operator precedence ([@sc1f](https://github.com/sc1f))
  * [#1057](https://github.com/finos/perspective/pull/1057) Enable Manylinux wheel builds ([@sc1f](https://github.com/sc1f))

#### Fixed
  * [#1074](https://github.com/finos/perspective/pull/1074) Use local time for column/row headers and computed functions ([@sc1f](https://github.com/sc1f))
  * [#1065](https://github.com/finos/perspective/pull/1065) Fix regression in regex for Firefox ([@sc1f](https://github.com/sc1f))
  * [#1077](https://github.com/finos/perspective/pull/1077) Refactor manager internal API, speed up string filters in UI,  add manager API tests ([@sc1f](https://github.com/sc1f))
  
#### Internal
  * [#1095](https://github.com/finos/perspective/pull/1095) Fix Windows build on Azure ([@sc1f](https://github.com/sc1f))
  * [#1060](https://github.com/finos/perspective/pull/1060) Use `regular-table` ([@texodus](https://github.com/texodus))
  * [#1091](https://github.com/finos/perspective/pull/1091) Cleans up CMakeLists & Python build scripts, fixes datetime string rendering ([@sc1f](https://github.com/sc1f))
  * [#1046](https://github.com/finos/perspective/pull/1046) Remap lab extension command in makefile ([@timkpaine](https://github.com/timkpaine))
  * [#1065](https://github.com/finos/perspective/pull/1065) Fix regression in regex for Firefox ([@sc1f](https://github.com/sc1f))
  * [#1095](https://github.com/finos/perspective/pull/1095) Fix Windows build on Azure ([@sc1f](https://github.com/sc1f))
  * [#1074](https://github.com/finos/perspective/pull/1074) Use local time for column/row headers and computed functions ([@sc1f](https://github.com/sc1f))

## [0.5.0] (2020-05-24)

#### Added
  * [#983](https://github.com/finos/perspective/pull/983) Expression-based Computed Columns ([@sc1f](https://github.com/sc1f))
  * [#1052](https://github.com/finos/perspective/pull/1052) Autocomplete ([@sc1f](https://github.com/sc1f))
  * [#1043](https://github.com/finos/perspective/pull/1043) Implement Client/Server Editing ([@sc1f](https://github.com/sc1f))
  * [#975](https://github.com/finos/perspective/pull/975) Reference python objects directly in perspective tables ([@timkpaine](https://github.com/timkpaine))

#### Internal
  * [#1043](https://github.com/finos/perspective/pull/1043) Implement Client/Server Editing ([@sc1f](https://github.com/sc1f))
  * [#1028](https://github.com/finos/perspective/pull/1028) Fix minor bugs in Perspective datetime + NaN handling ([@sc1f](https://github.com/sc1f))
  * [#1022](https://github.com/finos/perspective/pull/1022) Fix flapping `perspective-workspace` tests ([@texodus](https://github.com/texodus))

## [0.4.7] (2020-04-06)

#### Added
  * [#991](https://github.com/finos/perspective/pull/991) Purge `@finos/perspective-viewer-hypergrid` ([@texodus](https://github.com/texodus))
  * [#993](https://github.com/finos/perspective/pull/993) `@finos/perspective-viewer-datagrid` Tree Formatting ([@texodus](https://github.com/texodus))

#### Fixed
  * [#1002](https://github.com/finos/perspective/pull/1002) Fix column resizing when column pivots are present, and update docs and examples. ([@texodus](https://github.com/texodus))
  * [#997](https://github.com/finos/perspective/pull/997) `@finos/perspective-viewer-datagrid` Bug Fixes ([@texodus](https://github.com/texodus))
  * [#1000](https://github.com/finos/perspective/pull/1000) Fix incorrect sort order when hidden, pivoted columns are sorted ([@sc1f](https://github.com/sc1f))
  * [#985](https://github.com/finos/perspective/pull/985) tweak accessor to accept numpy dict ([@timkpaine](https://github.com/timkpaine))
  * [#982](https://github.com/finos/perspective/pull/982) remove cpp test check from setup.py (no more cpp tests) ([@timkpaine](https://github.com/timkpaine))
  * [#990](https://github.com/finos/perspective/pull/990) perspective-workspace fixes ([@zemeolotu](https://github.com/zemeolotu))

#### Internal
  * [#999](https://github.com/finos/perspective/pull/999) Add `lock` to PerspectiveManager ([@sc1f](https://github.com/sc1f))
  * [#995](https://github.com/finos/perspective/pull/995) Look for PyArrow relative to Perspective in @rpath ([@sc1f](https://github.com/sc1f))

## [0.4.6] (2020-03-17)

#### Added
  * [#954](https://github.com/finos/perspective/pull/954) New plugin `@finos/perspective-viewer-datagrid` ([@texodus](https://github.com/texodus))
  * [#979](https://github.com/finos/perspective/pull/979) Datagrid row selection and column resize ([@texodus](https://github.com/texodus))
  * [#967](https://github.com/finos/perspective/pull/967) Datagrid header click-to-sort and assorted improvements ([@texodus](https://github.com/texodus))
  * [#969](https://github.com/finos/perspective/pull/969) Add `linked` filter mode to `perspective-workspace` ([@zemeolotu](https://github.com/zemeolotu))
  * [#963](https://github.com/finos/perspective/pull/963) Refactor out `WebsSocketManager` from `WebSockerServer` ([@zemeolotu](https://github.com/zemeolotu))
  * [#957](https://github.com/finos/perspective/pull/957) Add ==, !=, >, <, and string equality computed columns ([@sc1f](https://github.com/sc1f))

#### Fixed
  * [#961](https://github.com/finos/perspective/pull/961) Fully clear queued updates before adding a new computed column ([@sc1f](https://github.com/sc1f))
  * [#965](https://github.com/finos/perspective/pull/965) PerspectiveManager no longer treats `str` as `bytes` in Python 2 ([@sc1f](https://github.com/sc1f))
  * [#973](https://github.com/finos/perspective/pull/973) Remove duplicate brew instructions ([@JHawk](https://github.com/JHawk))

#### Internal
  * [#970](https://github.com/finos/perspective/pull/970) update dependencies to jupyterlab 2.0, phosphor -> lumino ([@timkpaine](https://github.com/timkpaine))
  * [#977](https://github.com/finos/perspective/pull/977) Update azure-pipelines.yml for Azure Pipelines ([@timkpaine](https://github.com/timkpaine))

## [0.4.5] (2020-02-28)

#### Fixed
  * [#956](https://github.com/finos/perspective/pull/956) Emit source maps for WebWorker. ([@texodus](https://github.com/texodus))
  * [#953](https://github.com/finos/perspective/pull/953) Bugfix sdist ([@timkpaine](https://github.com/timkpaine))

#### Internal
  * [#939](https://github.com/finos/perspective/pull/939) Refactor `gnode` and `gnode_state`, remove C++ test suite ([@sc1f](https://github.com/sc1f))

## [0.4.4] (2020-02-26)

#### Fixed
  * [#948](https://github.com/finos/perspective/pull/948) Fixes off-by-one error in `end_col` ([@texodus](https://github.com/texodus))
  * [#946](https://github.com/finos/perspective/pull/946) Fix tables `delete` bug in `perspective-workspace` ([@zemeolotu](https://github.com/zemeolotu))
  * [#934](https://github.com/finos/perspective/pull/934) Fix widget title in `perspective-workspace` ([@zemeolotu](https://github.com/zemeolotu))
  * [#924](https://github.com/finos/perspective/pull/924) Fix `perspective-workspace` initialize bug ([@zemeolotu](https://github.com/zemeolotu))
  * [#925](https://github.com/finos/perspective/pull/925) Fix `perspective-workspace` non-unique generated slotid bug ([@zemeolotu](https://github.com/zemeolotu))
  * [#947](https://github.com/finos/perspective/pull/947) Closes [#945](https://github.com/finos/perspective/issues/945): Improve Python install docs ([@sc1f](https://github.com/sc1f))
  * [#943](https://github.com/finos/perspective/pull/943) Deal with np.int_ on Windows, handle missing __INDEX__ ([@timkpaine](https://github.com/timkpaine))
  * [#948](https://github.com/finos/perspective/pull/948) Fixes off-by-one error in `end_col` ([@texodus](https://github.com/texodus))

#### Internal
  * [#927](https://github.com/finos/perspective/pull/927) Remove some stale code ([@timkpaine](https://github.com/timkpaine))
  * [#930](https://github.com/finos/perspective/pull/930) Package/dist license in python package ([@timkpaine](https://github.com/timkpaine))
  * [#923](https://github.com/finos/perspective/pull/923) Fix for #921: unifies versioning between JS and Python libraries ([@sc1f](https://github.com/sc1f))
  * [#920](https://github.com/finos/perspective/pull/920) Adds test coverage reporting for`@finos/perspective` ([@texodus](https://github.com/texodus))

## [0.4.3] (2020-02-12)

#### Fixed
  * [#919](https://github.com/finos/perspective/pull/919) Remove `@finos/perspective-phosphor` and Closes [#825](https://github.com/finos/perspective/issues/825) regression. ([@texodus](https://github.com/texodus))

#### Internal
  * [#916](https://github.com/finos/perspective/pull/916) Added Azure compatible reporting for tests ([@texodus](https://github.com/texodus))
  * [#915](https://github.com/finos/perspective/pull/915) Set up CI with Azure Pipelines ([@timkpaine](https://github.com/timkpaine))
  * [#918](https://github.com/finos/perspective/pull/918) adding sdist check so we don't deploy broken sdists accidentally ([@timkpaine](https://github.com/timkpaine))

## [0.4.2] (2020-02-10)

#### Added
  * [#874](https://github.com/finos/perspective/pull/874) Add new package `@finos/perspective-workspace` ([@zemeolotu](https://github.com/zemeolotu))
  * [#881](https://github.com/finos/perspective/pull/881) Allow missing columns ([@texodus](https://github.com/texodus))
  * [#896](https://github.com/finos/perspective/pull/896) Implement save/restore on viewer configuration ([@timkpaine](https://github.com/timkpaine))
  * [#891](https://github.com/finos/perspective/pull/891) Make `@finos/perspective-workspace` widget title editable by doubleclick ([@zemeolotu](https://github.com/zemeolotu))
  * [#903](https://github.com/finos/perspective/pull/903) Make `perspective-viewer-hypergrid` selection state save/restore compatible ([@zemeolotu](https://github.com/zemeolotu))
  * [#894](https://github.com/finos/perspective/pull/894) Add 'perspective-select' event to `@finos/perspective-viewer-hypergrid` ([@zemeolotu](https://github.com/zemeolotu))
  * [#912](https://github.com/finos/perspective/pull/912) Remove `perspective.node` Python module. ([@texodus](https://github.com/texodus))
  * [#914](https://github.com/finos/perspective/pull/914) `perspective-viewer-hypergrid` Tree column toggle buttons.

#### Fixed
  * [#907](https://github.com/finos/perspective/pull/907) Fix column ordering in Python, null handling for computed columns ([@sc1f](https://github.com/sc1f))
  * [#899](https://github.com/finos/perspective/pull/899) Closes [#898](https://github.com/finos/perspective/issues/898) - week bucket overflows ([@sc1f](https://github.com/sc1f))
  * [#890](https://github.com/finos/perspective/pull/890) Style fixes for `perspective-workspace` ([@texodus](https://github.com/texodus))
  * [#886](https://github.com/finos/perspective/pull/886) Fixed React types. ([@texodus](https://github.com/texodus))
  * [#889](https://github.com/finos/perspective/pull/889) Fix selection styling on `@finos/perspective-viewer-hypergrid` ([@zemeolotu](https://github.com/zemeolotu))

#### Internal
  * [#902](https://github.com/finos/perspective/pull/902) Add 'workspace-layout-update' event and css class selector names cleanup  ([@zemeolotu](https://github.com/zemeolotu))
  * [#907](https://github.com/finos/perspective/pull/907) Fix column ordering in Python, null handling for computed columns ([@sc1f](https://github.com/sc1f))
  * [#884](https://github.com/finos/perspective/pull/884) Updates and fixes for windows build ([@timkpaine](https://github.com/timkpaine))
  * [#908](https://github.com/finos/perspective/pull/908) Remove yarn dependency duplication. ([@texodus](https://github.com/texodus))
  * [#906](https://github.com/finos/perspective/pull/906) Bump core-js to v3.6.4 and Babel to 7.8.4 ([@sebinsua](https://github.com/sebinsua))
  * [#892](https://github.com/finos/perspective/pull/892) Implement computed column functions in C++ ([@sc1f](https://github.com/sc1f))
  * [#901](https://github.com/finos/perspective/pull/901) Custom Element API for `<perspective-workspace>`

## [0.4.1] (2020-01-27)

#### Fixed
  * [#880](https://github.com/finos/perspective/pull/880) Fix `on_update` callbacks in Python ([@sc1f](https://github.com/sc1f))
  * [#867](https://github.com/finos/perspective/pull/867) Time zone awareness in perspective-python ([@sc1f](https://github.com/sc1f))
  * [#872](https://github.com/finos/perspective/pull/872) Improve `@finos/perspective-viewer` typings ([@zemeolotu](https://github.com/zemeolotu))
  * [#868](https://github.com/finos/perspective/pull/868) Allow plugins to be importable before '`perspective-viewer` ([@zemeolotu](https://github.com/zemeolotu))
  * [#866](https://github.com/finos/perspective/pull/866) Fix scrolling for pivoted hypergrid ([@sc1f](https://github.com/sc1f))

## [0.4.0] (2020-01-07)
#### Added
  * [#850](https://github.com/finos/perspective/pull/850) Implement `to_arrow` in C++ for JS/Python ([@sc1f](https://github.com/sc1f))
  * [#851](https://github.com/finos/perspective/pull/851) Exp bin functions ([@texodus](https://github.com/texodus))
  * [#842](https://github.com/finos/perspective/pull/842) Add `selectable` attribute to `perspective-viewer` ([@zemeolotu](https://github.com/zemeolotu))
  * [#846](https://github.com/finos/perspective/pull/846) `weighted mean` aggregate type ([@texodus](https://github.com/texodus))
  * [#845](https://github.com/finos/perspective/pull/845) Theme `material-dense` ([@texodus](https://github.com/texodus))
  * [#832](https://github.com/finos/perspective/pull/832) CSV/JSON renderer in JupyterLab ([@timkpaine](https://github.com/timkpaine))
  * [#829](https://github.com/finos/perspective/pull/829) Read date32, date64, decimal128 from Arrow datasets ([@sc1f](https://github.com/sc1f))
  * [#823](https://github.com/finos/perspective/pull/823) Add `delete()` to widget, cache client updates before render, refactor module structure ([@sc1f](https://github.com/sc1f))
  * [#799](https://github.com/finos/perspective/pull/799) Allow for right master ([@timkpaine](https://github.com/timkpaine))
  * [#765](https://github.com/finos/perspective/pull/765) Computed UX ([@texodus](https://github.com/texodus))
  * [#695](https://github.com/finos/perspective/pull/695) Readable dates ([@texodus](https://github.com/texodus))

#### Fixed
  * [#854](https://github.com/finos/perspective/pull/854) Fix `perspective-viewer` to allow loading a table before it's attache… ([@zemeolotu](https://github.com/zemeolotu))
  * [#853](https://github.com/finos/perspective/pull/853) Fix `perspective-jupyterlab` theme ([@zemeolotu](https://github.com/zemeolotu))
  * [#848](https://github.com/finos/perspective/pull/848) Fixed resize behavior ([@texodus](https://github.com/texodus))
  * [#835](https://github.com/finos/perspective/pull/835) Throttle fix ([@texodus](https://github.com/texodus))
  * [#844](https://github.com/finos/perspective/pull/844) Node.js `table` unpin ([@texodus](https://github.com/texodus))
  * [#838](https://github.com/finos/perspective/pull/838) Asynchronously process updates when running in Tornado ([@sc1f](https://github.com/sc1f))
  * [#822](https://github.com/finos/perspective/pull/822) Properly remove `on_delete` and `on_update` callbacks that fail. ([@sc1f](https://github.com/sc1f))
  * [#833](https://github.com/finos/perspective/pull/833) Preserve user columns and pivots in widget ([@sc1f](https://github.com/sc1f))
  * [#821](https://github.com/finos/perspective/pull/821) Default to int64 in Python3, add `long` and `unicode` to schema and type inference ([@sc1f](https://github.com/sc1f))
  * [#818](https://github.com/finos/perspective/pull/818) Fix misordered columns in update ([@sc1f](https://github.com/sc1f))
  * [#831](https://github.com/finos/perspective/pull/831) Fix `PerspectiveWorkspace` when tabbed views are moved to master ([@zemeolotu](https://github.com/zemeolotu))

#### Internal
  * [#852](https://github.com/finos/perspective/pull/852) Add benchmark suite for Python, Refactor module loading for environments where C++ cannot be built  ([@sc1f](https://github.com/sc1f))
  * [#852](https://github.com/finos/perspective/pull/852) Update versioning script for Python ([@sc1f](https://github.com/sc1f))
  * [#839](https://github.com/finos/perspective/pull/839) Python build overhaul ([@timkpaine](https://github.com/timkpaine))
  * [#836](https://github.com/finos/perspective/pull/836) Remove `ci_python` and refactor scripts. ([@texodus](https://github.com/texodus))
  * [#834](https://github.com/finos/perspective/pull/834) Set Enums as values for Widget/Viewer, refactor test folder structure ([@sc1f](https://github.com/sc1f))
  * [#840](https://github.com/finos/perspective/pull/840) Async resize ([@texodus](https://github.com/texodus))
  * [#837](https://github.com/finos/perspective/pull/837) Improvements to Arrow updates and indexed columns ([@sc1f](https://github.com/sc1f))
  * [#802](https://github.com/finos/perspective/pull/802) Tweak date/datetime inference, remove dependency on non-core Numpy/Pandas API ([@sc1f](https://github.com/sc1f))
  * [#800](https://github.com/finos/perspective/pull/800) add websocket export in type definition ([@timkpaine](https://github.com/timkpaine))
  * [#798](https://github.com/finos/perspective/pull/798) Add umd build and updated tests for `perspective-phosphor` ([@zemeolotu](https://github.com/zemeolotu))
  * [#763](https://github.com/finos/perspective/pull/763) Python sdist  ([@timkpaine](https://github.com/timkpaine))
  * [#778](https://github.com/finos/perspective/pull/778) Adjust setup.py for MacOS wheel dist ([@sc1f](https://github.com/sc1f))
  * [#777](https://github.com/finos/perspective/pull/777) Add exception handling, clean up PSP_COMPLAIN_AND_ABORT ([@sc1f](https://github.com/sc1f))
  * [#768](https://github.com/finos/perspective/pull/768) Upgrade Arrow to 0.15.0, link python arrow from prebuilt library ([@sc1f](https://github.com/sc1f))
  * [#779](https://github.com/finos/perspective/pull/779) Fixes jupyterlab plugin regressions ([@texodus](https://github.com/texodus))
  * [#766](https://github.com/finos/perspective/pull/766) Add tornado handler for perspective-python ([@sc1f](https://github.com/sc1f))

#### Documentation
  * [#847](https://github.com/finos/perspective/pull/847) add editable example to readme ([@timkpaine](https://github.com/timkpaine))
  * [#820](https://github.com/finos/perspective/pull/820) Add PerspectiveWorkspace olympics example to README ([@zemeolotu](https://github.com/zemeolotu))
  * [#819](https://github.com/finos/perspective/pull/819) Update Perspective website with Python API and user guide ([@sc1f](https://github.com/sc1f))

[0.3.9] - 2019-09-16
### Added
* [#698](https://github.com/jpmorganchase/perspective/pull/698) Support for updating-by & querying implicitly indexed `table`s via `"__INDEX__"`.
* [#699](https://github.com/jpmorganchase/perspective/pull/699) Adds `leaves_only` option for `to_*` methods.
* [#700](https://github.com/jpmorganchase/perspective/pull/700) Charts now display the first-N point on overflow, rather than only warn.
* [#715](https://github.com/jpmorganchase/perspective/pull/715) Editing support via the `editable` attribute, for `@finos/perspective-viewer-hypergrid`.
  
### Fixed
* [#691](https://github.com/jpmorganchase/perspective/pull/691) Fix for reading batched arrows.
* [#702](https://github.com/jpmorganchase/perspective/pull/702) Fix compatibility with ipywidgets.
* [#703](https://github.com/jpmorganchase/perspective/pull/703) Fix attribtue API to be less noisy.
* [#718](https://github.com/jpmorganchase/perspective/pull/718) Updated ES6 compat to remove regenerator dependency.

### Internal
* [#725](https://github.com/jpmorganchase/perspective/pull/725) `yarn setup` task for dev.

[0.3.8] - 2019-08-26
### Fixed
* [#689](https://github.com/jpmorganchase/perspective/pull/689) Performance enchancements for `update()`.
* [#690](https://github.com/jpmorganchase/perspective/pull/690) Ported to `llvm-upstream` branch fo Emscripten.

[0.3.7] - 2019-08-20
### Added
* [#676](https://github.com/jpmorganchase/perspective/pull/676) Added null-filtering API and UI.
* [#682](https://github.com/jpmorganchase/perspective/pull/676) Added type-specific styling API, with additional style properties for `@finos/perspective-viewer-hypergrid`.

### Fixed
* [#663](https://github.com/jpmorganchase/perspective/pull/663) Allow Apache Arrow inputs to optionally declare a schema.
* [#666](https://github.com/jpmorganchase/perspective/pull/666) Fixed `@finos/persoective-viewer` aggregate persistence for computed columns.
* [#669](https://github.com/jpmorganchase/perspective/pull/669) Fixed `@finos/persoective-viewer` filtering on null values.
* [#675](https://github.com/jpmorganchase/perspective/pull/675) Fixed `@finos/persoective-jupyterlab` publish versioning.
* [#672](https://github.com/jpmorganchase/perspective/pull/672) Fixed config parsing.
* [#683](https://github.com/jpmorganchase/perspective/pull/683) Fixed D3FC version regression
* [#684](https://github.com/jpmorganchase/perspective/pull/684) Fixed scatter chart click events.
* [#685](https://github.com/jpmorganchase/perspective/pull/685) Fixed config performance issue.
* [#686](https://github.com/jpmorganchase/perspective/pull/686) Fixed `@finos/persoective-viewer-hypergrid` click propagation issue.
  
[0.3.6] - 2019-07-15
### Fixed
* [#660](https://github.com/jpmorganchase/perspective/pull/660) Fixed webpack path resolution bug.
  
[0.3.5] - 2019-07-14
### Added
* [#644](https://github.com/jpmorganchase/perspective/pull/644) Global project config via `perspective.config.js`
* [#639](https://github.com/jpmorganchase/perspective/pull/629) New perspective-viewer API.
* [#641](https://github.com/jpmorganchase/perspective/pull/641) Simplified `@finos/perspective-webpack-plugin`.
* [#650](https://github.com/jpmorganchase/perspective/pull/650) Resizable panels for `@finos/perspective-viewer`.
  
### Fixed
* [#634](https://github.com/jpmorganchase/perspective/pull/634) Fixed node.js async load error.
* [#635](https://github.com/jpmorganchase/perspective/pull/635) Fixed issue with multiple web workers.
* [#649](https://github.com/jpmorganchase/perspective/pull/649) Fixed click event bug in `@finos/perspective-viewer-hypergrid`.
* [#651](https://github.com/jpmorganchase/perspective/pull/651) Fixed issue pivotting on `null` values.

[0.3.1] - 2019-06-25
### Added
* [#629](https://github.com/jpmorganchase/perspective/pull/629) asm.js/IE support removed.

### Fixed
* [#628](https://github.com/jpmorganchase/perspective/pull/628) Better memory utilization.
* [#625](https://github.com/jpmorganchase/perspective/pull/625) Fixes to `perspective-phosphor`.

[0.3.0] - 2019-06-02
### Added
* [#558](https://github.com/jpmorganchase/perspective/pull/558) `@jpmorganchase/perspective*` is now `@finos/perspective*`.
* [#599](https://github.com/jpmorganchase/perspective/pull/599) `perspective-viewer-d3fc` is the default chart plugin.
* [#574](https://github.com/jpmorganchase/perspective/pull/574) Auto-conflation of messages for `table()`.  `update()` and `on_update()` calls are no longer 1:1, but overall update throughput has been greatly increased.
* [#589](https://github.com/jpmorganchase/perspective/pull/589) `on_update()` method now returns Apache Arrow with `mode: "row"` option, enabling full Arrow server->client real-time streaming.
* [#563](https://github.com/jpmorganchase/perspective/pull/563) Treemaps added to `perspective-viewer-d3fc`.
* [#564](https://github.com/jpmorganchase/perspective/pull/564) Dual-axis support added to `perspective-viewer-d3fc` line charts.
* [#581](https://github.com/jpmorganchase/perspective/pull/581) Dual-axis support added to `perspective-viewer-d3fc` area, scatter and column charts.
* [#553](https://github.com/jpmorganchase/perspective/pull/553) Added `style_element()` method to `<perspective-viewer>` to refresh styles when CSS is updated.
* [#557](https://github.com/jpmorganchase/perspective/pull/557) Category filters on `<perspective-viewer>` now auto-select and auto-focus.

### Fixed
* [#561](https://github.com/jpmorganchase/perspective/pull/561) Handle `boolean` columns in Apache Arrow correctly.
* [#580](https://github.com/jpmorganchase/perspective/pull/580) Better responsive layout for narrow `<perspective-viewer>`s.

### Internal
* [#587](https://github.com/jpmorganchase/perspective/pull/587) Port to Webpack 4.
* [#588](https://github.com/jpmorganchase/perspective/pull/588) new stand-alone benchmarking tool `perspective-bench`.

# [0.2.23] - 2019-04-22
### Added
* [#547](https://github.com/jpmorganchase/perspective/pull/547) Added `to_arrow()` support to remote perspective, as well as ability to host `view()`s in addition to `table()`s.
* [#549](https://github.com/jpmorganchase/perspective/pull/549) Added table ownership flag to `perspective-viewer` `delete()` method.
  
### Fixed
* [#542](https://github.com/jpmorganchase/perspective/pull/542) Fixed Hypergrid formatting issue when changing row-pivots.
* [#544](https://github.com/jpmorganchase/perspective/pull/544) Fixed `save()` and `restore()` plugin method APIs.
* [#546](https://github.com/jpmorganchase/perspective/pull/546) Fixed Hypergrid theme issue when page contains multiple themes.

# [0.2.22] - 2019-04-10
### Added
* [#511](https://github.com/jpmorganchase/perspective/pull/511) Sunburst charts for `perspective-viewer-d3fc`, as well as support for perspective themes.
* [#517](https://github.com/jpmorganchase/perspective/pull/517) Added `options` parameter to `view.on_update` method, and new `rows`, `none` and `pkey` update modes.
* [#527](https://github.com/jpmorganchase/perspective/pull/527) Split `aggregate` view config option into `columns` and `aggregates` ala `<perspective-viewer>`, and named other properties like `row_pivots` consistently as well.  Old properties emit warnings.
* [#531](https://github.com/jpmorganchase/perspective/pull/531) `perspective.table` can now be sorted by columns not in the `columns` list.
* [#532](https://github.com/jpmorganchase/perspective/pull/532) Added `save()` and `restore()` methods to the `<perspective-viewer>` plugin API.
* [#534](https://github.com/jpmorganchase/perspective/pull/534) Resizable Legends for `perspective-viewer-d3fc`, plus multiple bug fixes.

### Fixed
* [#521](https://github.com/jpmorganchase/perspective/pull/521) Fixed Hypergrid scroll stuttering on wide tables.
* [#523](https://github.com/jpmorganchase/perspective/pull/523) Fixed row count on column-only pivots.
* [#529](https://github.com/jpmorganchase/perspective/pull/529) Fixed column sorting regression.
* [#538](https://github.com/jpmorganchase/perspective/pull/538) Fixed issue which caused Hypergrid to freeze when the column set changed during `update()`

### Internal
* [#537](https://github.com/jpmorganchase/perspective/pull/537) Upgraded Emscripten to 1.38.29 `perspective/emsdk:latest`.
* [#539](https://github.com/jpmorganchase/perspective/pull/539) Upgraded Puppeteer `perspective/puppeteer:latest`.
* [#520](https://github.com/jpmorganchase/perspective/pull/520) Updated `docs/` build and integrated into `master` branch.

# [0.2.21] - 2019-04-03
### Added
* [#488](https://github.com/jpmorganchase/perspective/pull/488) Candlestick and OHLC charts for `perspective-viewer-d3fc`.
* [#479](https://github.com/jpmorganchase/perspective/pull/479) Added zooming, label rotation and new scatter types to `perspective-viewer-d3fc`.
* [#498](https://github.com/jpmorganchase/perspective/pull/498) Bollinger bands, moving averages, draggable legends for `perspective-viewer-d3fc`.
* [#489](https://github.com/jpmorganchase/perspective/pull/489) Header sort indicator for `perspective-viewer-hypergrid`.
* [#506](https://github.com/jpmorganchase/perspective/pull/506) Header click-to-sort for `perspective-viewer-hypergrid`, improved scroll performance.
* [#516](https://github.com/jpmorganchase/perspective/pull/516) New `perspective-cli` package for convenient Perspective operations from the command line.
* [#483](https://github.com/jpmorganchase/perspective/pull/483) Performance improvement for `perspective.to_*` methods.
* [#485](https://github.com/jpmorganchase/perspective/pull/485) Added window support to `to_arrow()` method.
* [#486](https://github.com/jpmorganchase/perspective/pull/486) Disabled delta calculation for `on_update` method by default, improving update performance.
* [#503](https://github.com/jpmorganchase/perspective/pull/503) Added `get_config()` API to `perspective.table`.
* [#512](https://github.com/jpmorganchase/perspective/pull/512) Column context labels are now configurable via the plugin API.

### Fixed
* [#478](https://github.com/jpmorganchase/perspective/pull/478) Fixed broken filtering on `date` type columns.
* [#486](https://github.com/jpmorganchase/perspective/pull/486) Fixed un-pivoted `view.to_schema()` method to only show visible columns.
* [#490](https://github.com/jpmorganchase/perspective/pull/490) Fixed bug which removed filter columns when dragged from active columns list.
* [#491](https://github.com/jpmorganchase/perspective/pull/491) Fixed `perspective-webpack-plugin` load_path issue when `perspective-*` modules are not at the top-level of `node_modules`.
* [#493](https://github.com/jpmorganchase/perspective/pull/493) Fixed `sum abs` aggregate type.
* [#501](https://github.com/jpmorganchase/perspective/pull/501) Fixed pivot on categories containing nulls bug.
* [#502](https://github.com/jpmorganchase/perspective/pull/502) Fixed expand/collapse on 2-sided contexts bug.

### Internal
* [#497](https://github.com/jpmorganchase/perspective/pull/497) Added local puppeteer mode for testing.
  
## [0.2.20] - 2019-03-07
### Added
* [#463](https://github.com/jpmorganchase/perspective/pull/463) D3FC plugin features Area and Heatmap charts, hierarchial axes have been added to all chart types, as well as a host of additioanl improvements.
* [#473](https://github.com/jpmorganchase/perspective/pull/473) Performance improvement to `to_*()` output methods.
* [#469](https://github.com/jpmorganchase/perspective/pull/469) `open()` in the node.js API now takes a `table()` argument so it may be retained in the invoking code.
* [#475](https://github.com/jpmorganchase/perspective/pull/475) Added `not in` filter type to `<perspective-viewer>`.
  
### Fixed
* [#470](https://github.com/jpmorganchase/perspective/pull/470) Fixed Jupyterlab extension dist
* [#471](https://github.com/jpmorganchase/perspective/pull/471) Fixed CSV parse issue when converting `integer` to `string` via schema.

### Internal
* [#468](https://github.com/jpmorganchase/perspective/pull/468) Perspective JS can now be built on Windows (with Docker).

## [0.2.19] - 2019-03-01
### Fixed
* [#461](https://github.com/jpmorganchase/perspective/pull/461) Fixed click event bugs in `perspective-viewer-hypergrid` and `perspective-viewer-highcharts`

## [0.2.18] - 2019-02-27
### Added
* [#420](https://github.com/jpmorganchase/perspective/pull/420) New plugin based on D3FC - `perspective-viewer-d3fc`.
* [#439](https://github.com/jpmorganchase/perspective/pull/439) Added `perspective-click` event for all plugins, which in addition to the basic click details also generates the reciprocal filter matching the rows in any aggregate, such that `<perspective-viewer>`s can be linked.

### Fixed
* [#445](https://github.com/jpmorganchase/perspective/pull/445) Fixed expand/collapse bug.
* [#448](https://github.com/jpmorganchase/perspective/pull/448) Fixed 'Invalid Date' axis issue in `perspective-viewer-highcharts` plugin.
* [#450](https://github.com/jpmorganchase/perspective/pull/450) Fixed `perspective-jupyterlab` plugin to inexplicably build to `dist/`.
* [#453](https://github.com/jpmorganchase/perspective/pull/453) Fixed missing type definition for `shared_worker` in `perspective`.
* [#451](https://github.com/jpmorganchase/perspective/pull/451) Fixed github-reported dependency vulnerabilites.

## [0.2.16] - 2019-02-19
### Added
* [#431](https://github.com/jpmorganchase/perspective/pull/431) Added `clear()` and `replace()` APIs to `perspective` and `<perspective-viewer>`.
* [#435](https://github.com/jpmorganchase/perspective/pull/435) Added `to_arrow()` method to `view()` for writing Apache Arrow `ArrayBuffer`s.
* [#436](https://github.com/jpmorganchase/perspective/pull/436) New module `perspective-phosphor`, which adds bindings for the Phosphor.js framework.

### Fixed
* [#434](https://github.com/jpmorganchase/perspective/pull/434) Deprecated `[column]` sort syntax for `perspective` and `<perspective-viewer>`.

### Internal
* [#426](https://github.com/jpmorganchase/perspective/pull/426) Refactored C++ projects into separate repo structure.
* [#413](https://github.com/jpmorganchase/perspective/pull/413) Moved structure of `view()` to C++.

## [0.2.15] - 2019-02-07
### Fixed
* [#416](https://github.com/jpmorganchase/perspective/pull/416) Fixed highcharts bug which caused `null` groups to not render.
* [#419](https://github.com/jpmorganchase/perspective/pull/419) Fixed regression in cross-origin loading.
* [#421](https://github.com/jpmorganchase/perspective/pull/421) Fixed JSON/CSV loading when columns contain mixed numeric/string values.

## [0.2.14] - 2019-02-04
### Added
* [#408](https://github.com/jpmorganchase/perspective/pull/408) Added `flush()` method to `<perspective-viewer>`

### Fixed
* [#409](https://github.com/jpmorganchase/perspective/pull/409) Fixed `perspective-webpack-plugin` conflicts with external loaders.

## [0.2.13] - 2019-02-04
### Added
* [#399](https://github.com/jpmorganchase/perspective/pull/399) New package `perspective-webpack-plugin` for webpack integration
* [#394](https://github.com/jpmorganchase/perspective/pull/394) Websocket server supports reconnects/heartbeat.

### Fixed
* [#407](https://github.com/jpmorganchase/perspective/pull/407) Slightly better date parsing.
* [#403](https://github.com/jpmorganchase/perspective/pull/403) Fixed webpack cross path loading.

## [0.2.12] - 2019-01-18
### Added
* [#356](https://github.com/jpmorganchase/perspective/pull/356) Perspective for Python!
* [#381](https://github.com/jpmorganchase/perspective/pull/381) Perspective for C++ Linux, MacOS and Windows!
* [#375](https://github.com/jpmorganchase/perspective/pull/375) Filter validation UX for `<perspective-viewer>`.

### Fixed
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

### Fixed
* [#343](https://github.com/jpmorganchase/perspective/pull/343) Fixed regression in type inference for empty string columns
* [#344](https://github.com/jpmorganchase/perspective/pull/344) Fixed UI lock when invalid filters applied

### Internal
* [#350](https://github.com/jpmorganchase/perspective/pull/350) New benchmark suite

## [0.2.10] - 2018-12-09
### Fixed
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

### Fixed
* [#306](https://github.com/jpmorganchase/perspective/pull/306) Fixed Jupyterlab plugin, updating it to work with the newest [perspective-python 0.1.1](https://github.com/timkpaine/perspective-python/tree/v0.1.1).

## [0.2.7] - 2018-11-12
### Fixed
* [#304](https://github.com/jpmorganchase/perspective/pull/304) Fixed missing file in NPM package.

## [0.2.6] - 2018-11-12
### Fixed
* [#303](https://github.com/jpmorganchase/perspective/pull/303) Fixed `webpack-plugin` babel-loader configuration issue.

## [0.2.5] - 2018-11-09
### Fixed
* [#301](https://github.com/jpmorganchase/perspective/pull/301) Fixed missing `webpack-plugin` export and `babel-polyfill` import.

## [0.2.4] - 2018-11-08
### Added
* [#299](https://github.com/jpmorganchase/perspective/pull/299) Added a new Menu bar (accessible via right-click on the config button) for `reset`, `copy` and `download` actions, and an API for `download()` (`copy()` and `reset()` already exist).
* [#295](https://github.com/jpmorganchase/perspective/pull/295) `@jpmorganchase/perspective` now exports `wepback-plugin` for easy integration with WebPack, [example](https://github.com/jpmorganchase/perspective/blob/master/examples/webpack/webpack.config.js).  Webpacked builds are overall smaller as well. 
* [#290](https://github.com/jpmorganchase/perspective/pull/290) Large aggregate datasets now trigger a render warning before attempting to render.

### Fixed
* [#298](https://github.com/jpmorganchase/perspective/pull/298) Fixed Material dark theming readbility for hovers and dropdowns.

## [0.2.3] - 2018-10-25
### Added
* [#286](https://github.com/jpmorganchase/perspective/pull/286) Ported `<perspective-viewer>` to utilize Shadow DOM.
* [#271](https://github.com/jpmorganchase/perspective/pull/271) Added support for `date` type in addition to `datetime` (formerly `date`).  `date`s can be specified in a `schema` or inferred from inputs.
* [#273](https://github.com/jpmorganchase/perspective/pull/273) Added `col_to_js_typed_array` method to `view()`.
* [#284](https://github.com/jpmorganchase/perspective/pull/284) Updated Jupyterlab support to 0.35.x
* [#287](https://github.com/jpmorganchase/perspective/pull/287) `restore()` is now a `Promise`.
  
### Fixed
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
  
### Fixed
* Fixed a bug which de-registered updates when a computed column was added.
* Fixed source-maps for Web Workers.
* Fixed aggregate bug which caused partial updates without aggregate to incorrectly apply to aggregate.
* Fixed flapping tooltip test #210.
* Fixed CSS regression in Chrome Canary 71.
