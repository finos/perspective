# Changelog

## [v1.1.0](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.8...HEAD)

**Breaking changes:**

- CSV output rewrite \(Arrow/C++\) [\#1692](https://github.com/finos/perspective/pull/1692) ([texodus](https://github.com/texodus))

**Implemented enhancements:**

- Column style menu for `string` type columns [\#1691](https://github.com/finos/perspective/pull/1691) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- String field filter in server mode not work [\#1690](https://github.com/finos/perspective/issues/1690)
- CSV output with `row_pivots` \> 1 don't render correctly [\#1666](https://github.com/finos/perspective/issues/1666)
- Fix auto-reset when `HTMLPerspectiveViewerElement.load()` called twice [\#1695](https://github.com/finos/perspective/pull/1695) ([texodus](https://github.com/texodus))

**Closed issues:**

- SyntaxError: Unexpected token '.' when using webpack PerspectivePlugin [\#1687](https://github.com/finos/perspective/issues/1687)
- installation error Ubuntu 20.04.3 LTS \(GNU/Linux 5.11.0-1021-oracle aarch64\) [\#1686](https://github.com/finos/perspective/issues/1686)

**Merged pull requests:**

- purge six dependency [\#1689](https://github.com/finos/perspective/pull/1689) ([timkpaine](https://github.com/timkpaine))
- Reduce CI: Turn off branch builds, only build on PRs to master [\#1688](https://github.com/finos/perspective/pull/1688) ([timkpaine](https://github.com/timkpaine))

## [v1.0.8](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.7...HEAD)

**Implemented enhancements:**

- 80% reduction in `.wasm` asset size [\#1683](https://github.com/finos/perspective/pull/1683) ([texodus](https://github.com/texodus))
- Use `puppeteer` for app from CLI [\#1674](https://github.com/finos/perspective/pull/1674) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Missing libbinding.pyd in Windows 3.9 1.0.7 [\#1677](https://github.com/finos/perspective/issues/1677)
- DateTime Comparison Blanks out when the milliseconds is 0 [\#1645](https://github.com/finos/perspective/issues/1645)
- `date` and `datetime` filter bug fixes and support for non-Chrome browsers [\#1685](https://github.com/finos/perspective/pull/1685) ([texodus](https://github.com/texodus))
- Fix Treemap zoom when a group level is `null` [\#1676](https://github.com/finos/perspective/pull/1676) ([texodus](https://github.com/texodus))

**Merged pull requests:**

- Benchmarks update [\#1681](https://github.com/finos/perspective/pull/1681) ([texodus](https://github.com/texodus))
- Upgrade Arrow to `6.0.2` [\#1680](https://github.com/finos/perspective/pull/1680) ([texodus](https://github.com/texodus))
- fix wheel build, make extension first to ensure binaries are inlined, then assemble wheel [\#1679](https://github.com/finos/perspective/pull/1679) ([timkpaine](https://github.com/timkpaine))

## [v1.0.7](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.6...HEAD)

**Implemented enhancements:**

- Preserve `expressions` on reset \(shift+ to force\) [\#1673](https://github.com/finos/perspective/pull/1673) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Some expressions are available in Perspective-Python but not in the Monaco editor [\#1671](https://github.com/finos/perspective/issues/1671)
- Fix `perspective-workspace` errors [\#1675](https://github.com/finos/perspective/pull/1675) ([texodus](https://github.com/texodus))

**Merged pull requests:**

- Build windows wheel every time so its tested [\#1672](https://github.com/finos/perspective/pull/1672) ([timkpaine](https://github.com/timkpaine))

## [v1.0.6](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.5...HEAD)

**Implemented enhancements:**

- Fix `perspective-workspace` and add `monaco-editor-webpack-plugin` compatibility to `perspective-webpack-plugin` [\#1662](https://github.com/finos/perspective/pull/1662) ([texodus](https://github.com/texodus))
- D3FC fast `Treemap`, fix for non-POSIX time axis, better resize [\#1660](https://github.com/finos/perspective/pull/1660) ([texodus](https://github.com/texodus))
- Resizable expression editor [\#1643](https://github.com/finos/perspective/pull/1643) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- perspective-view collapse / expand functions returning error [\#1656](https://github.com/finos/perspective/issues/1656)
- Themes moved causing build errors [\#1648](https://github.com/finos/perspective/issues/1648)
- Fix `position: sticky` Chrome render bug in `perspective-viewer-datagrid` [\#1661](https://github.com/finos/perspective/pull/1661) ([texodus](https://github.com/texodus))
- Implement `getView()` [\#1657](https://github.com/finos/perspective/pull/1657) ([texodus](https://github.com/texodus))

**Merged pull requests:**

- add missing definition for re2 on os x to reenable conda builds [\#1654](https://github.com/finos/perspective/pull/1654) ([timkpaine](https://github.com/timkpaine))

## [v1.0.5](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.4...HEAD)

**Fixed bugs:**

- DateTime Comparison Blanks out when the milliseconds is 0 [\#1645](https://github.com/finos/perspective/issues/1645)
- Treemap zoom-out misrenders and does not fire `perspective-click` event [\#1628](https://github.com/finos/perspective/issues/1628)
- Treemap zoom broken in `1.0.1` [\#1627](https://github.com/finos/perspective/issues/1627)
- Fix `datetime`/`date`/`integer`/`float` filter occasionally resetting while typing [\#1653](https://github.com/finos/perspective/pull/1653) ([texodus](https://github.com/texodus))
- D3FC Treemap bug fixes [\#1652](https://github.com/finos/perspective/pull/1652) ([texodus](https://github.com/texodus))

## [v1.0.4](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.3...HEAD)

**Implemented enhancements:**

- Parallelized `.wasm` download and deferred font loading [\#1647](https://github.com/finos/perspective/pull/1647) ([texodus](https://github.com/texodus))
- Add auto-resizing to `<perspective-viewer>` [\#1633](https://github.com/finos/perspective/pull/1633) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- build errors after upgrade to 1.0.3 [\#1646](https://github.com/finos/perspective/issues/1646)
- Remove wasm-pack artifacts which interfere with perspective packaging [\#1651](https://github.com/finos/perspective/pull/1651) ([texodus](https://github.com/texodus))
- Fix column-selector collapse \(inverted\) [\#1650](https://github.com/finos/perspective/pull/1650) ([texodus](https://github.com/texodus))
- Emit `.d.ts` declaration files for `@finos/perspective-viewer` [\#1649](https://github.com/finos/perspective/pull/1649) ([texodus](https://github.com/texodus))

**Merged pull requests:**

- \[Formatting\] force line-feed line endings for all text files for easier windows development [\#1635](https://github.com/finos/perspective/pull/1635) ([timkpaine](https://github.com/timkpaine))
- Overload re2 cmakelists to fix cmake/threads detection issue on conda-forge mac builds, and pin C++ dependency versions [\#1634](https://github.com/finos/perspective/pull/1634) ([timkpaine](https://github.com/timkpaine))
- Update CMakeLists.txt for more thread help on mac for conda [\#1631](https://github.com/finos/perspective/pull/1631) ([timkpaine](https://github.com/timkpaine))
- \[Formatting\] Fix mixed tabs/spaces in C++ CMakeLists.txt  [\#1630](https://github.com/finos/perspective/pull/1630) ([timkpaine](https://github.com/timkpaine))
- Fix Azure windows wheel step [\#1629](https://github.com/finos/perspective/pull/1629) ([texodus](https://github.com/texodus))

## [v1.0.3](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.2...HEAD)

**Fixed bugs:**

- Missing data not properly handled when "limit" is set [\#1616](https://github.com/finos/perspective/issues/1616)
- JupyterLab CSV widget not working anymore [\#1612](https://github.com/finos/perspective/issues/1612)
- Precision Display Window on Dark Background [\#1609](https://github.com/finos/perspective/issues/1609)
- DateTime Uses GMT instead of Local Time [\#1606](https://github.com/finos/perspective/issues/1606)
- Fix partial-updates on tables with `limit` set for javascript [\#1624](https://github.com/finos/perspective/pull/1624) ([texodus](https://github.com/texodus))
- Fix partial-updates on tables with `limit` set for python [\#1623](https://github.com/finos/perspective/pull/1623) ([texodus](https://github.com/texodus))
- Fix `datetime` filter timezone bug [\#1622](https://github.com/finos/perspective/pull/1622) ([texodus](https://github.com/texodus))
- `PerspectiveWidget()` dialog theme fix [\#1621](https://github.com/finos/perspective/pull/1621) ([texodus](https://github.com/texodus))
- Add `wait_for_table` flag to `getTable()` [\#1619](https://github.com/finos/perspective/pull/1619) ([texodus](https://github.com/texodus))
- Fix `worker.js` cross-origin workaround for CDN [\#1618](https://github.com/finos/perspective/pull/1618) ([texodus](https://github.com/texodus))

**Closed issues:**

- Customized types are not support perspective 1.0.1 [\#1602](https://github.com/finos/perspective/issues/1602)
- Update `windows-2016` to `windows-latest` and set up Visual Studio 2019 build [\#1601](https://github.com/finos/perspective/issues/1601)

**Merged pull requests:**

- bump windows build for vc 14.2 / vs 16 2019, add macos 11 build for py3.9 [\#1626](https://github.com/finos/perspective/pull/1626) ([timkpaine](https://github.com/timkpaine))
- add threads explicit on mac [\#1625](https://github.com/finos/perspective/pull/1625) ([timkpaine](https://github.com/timkpaine))
- Fix publish through practice [\#1620](https://github.com/finos/perspective/pull/1620) ([texodus](https://github.com/texodus))

## [v1.0.2](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.2...HEAD)

**Implemented enhancements:**

- More regex functions - find, substring, replace [\#1598](https://github.com/finos/perspective/pull/1598) ([sc1f](https://github.com/sc1f))
- Add Regex functions using Exprtk and RE2 [\#1596](https://github.com/finos/perspective/pull/1596) ([sc1f](https://github.com/sc1f))
- Persist edited expressions and add 'Reset' button [\#1594](https://github.com/finos/perspective/pull/1594) ([texodus](https://github.com/texodus))

**Closed issues:**

- Can't install perspective javascript libraries with yarn/npm [\#1605](https://github.com/finos/perspective/issues/1605)
- Can't install perspective-python on python3.9, macOS Big Sur [\#1603](https://github.com/finos/perspective/issues/1603)

**Merged pull requests:**

- Fix D3 alt-axis regression [\#1617](https://github.com/finos/perspective/pull/1617) ([texodus](https://github.com/texodus))
- New example [\#1615](https://github.com/finos/perspective/pull/1615) ([texodus](https://github.com/texodus))
- Publish script for Python [\#1613](https://github.com/finos/perspective/pull/1613) ([texodus](https://github.com/texodus))
- Port to `esbuild` [\#1611](https://github.com/finos/perspective/pull/1611) ([texodus](https://github.com/texodus))
- Upgrade `d3fc` to `15.2.4` and switch "Heatmap" to use canvas renderer [\#1599](https://github.com/finos/perspective/pull/1599) ([texodus](https://github.com/texodus))
- Add ExprTK example fractal [\#1595](https://github.com/finos/perspective/pull/1595) ([texodus](https://github.com/texodus))

## [v1.0.1](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.0...HEAD)

**Implemented enhancements:**

- Universal binaries for OSX [\#1590](https://github.com/finos/perspective/pull/1590) ([texodus](https://github.com/texodus))
- Drag/drop highlight and in-place column updates [\#1586](https://github.com/finos/perspective/pull/1586) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Access Violation with python 3.9 expressions [\#1575](https://github.com/finos/perspective/issues/1575)
- Stacked bar widths are calculated incorrectly when passed null values [\#1561](https://github.com/finos/perspective/issues/1561)
- Docs: unstyled perspective-viewer components on views guide [\#1534](https://github.com/finos/perspective/issues/1534)
- `@finos/perspective-webpack-plugin@0.10.0` has a stale peer dependency [\#1503](https://github.com/finos/perspective/issues/1503)
- Fix JupyterLab widget `filter` traitlet [\#1593](https://github.com/finos/perspective/pull/1593) ([texodus](https://github.com/texodus))
- Fix corrupt string results in `expressions` [\#1589](https://github.com/finos/perspective/pull/1589) ([texodus](https://github.com/texodus))

**Closed issues:**

- Remove dependency on system boost and statically link boost::regex [\#1564](https://github.com/finos/perspective/issues/1564)
- typo in docs index page [\#1506](https://github.com/finos/perspective/issues/1506)

**Merged pull requests:**

- Remove TBB [\#1591](https://github.com/finos/perspective/pull/1591) ([texodus](https://github.com/texodus))
- Remove python 2 from build and CI scripts [\#1583](https://github.com/finos/perspective/pull/1583) ([timkpaine](https://github.com/timkpaine))
- remove deprecated webpack-specific tilde prefix convention [\#1582](https://github.com/finos/perspective/pull/1582) ([timkpaine](https://github.com/timkpaine))
- Fix documentation typos [\#1581](https://github.com/finos/perspective/pull/1581) ([timkpaine](https://github.com/timkpaine))
- Update python classifiers [\#1579](https://github.com/finos/perspective/pull/1579) ([timkpaine](https://github.com/timkpaine))
- Align `@lumino` versions [\#1576](https://github.com/finos/perspective/pull/1576) ([texodus](https://github.com/texodus))
- Bar Rendering bug null sends fix [\#1569](https://github.com/finos/perspective/pull/1569) ([mattcolozzo](https://github.com/mattcolozzo))
- swap out JS style versioning in python script [\#1563](https://github.com/finos/perspective/pull/1563) ([timkpaine](https://github.com/timkpaine))
- Upgrade Apache Arrow to 5.0.0 [\#1545](https://github.com/finos/perspective/pull/1545) ([texodus](https://github.com/texodus))

## [v1.0.0](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v1.0.0-rc.2...HEAD)

**Breaking changes:**

- New `\<perspective-viewer\>` [\#1488](https://github.com/finos/perspective/pull/1488) ([texodus](https://github.com/texodus))

**Implemented enhancements:**

- toggleConfig\(\) via attribute and part of save\(\) \(for perspective-viewer\) [\#879](https://github.com/finos/perspective/issues/879)
- Boolean datagrid columns [\#1553](https://github.com/finos/perspective/pull/1553) ([texodus](https://github.com/texodus))
- Persistent column widths [\#1549](https://github.com/finos/perspective/pull/1549) ([texodus](https://github.com/texodus))
- Return booleans from expression comparisons, allow for vectors to be defined in expressions [\#1548](https://github.com/finos/perspective/pull/1548) ([sc1f](https://github.com/sc1f))
- Boolean column filter controls for `\<perspective-viewer\>` [\#1547](https://github.com/finos/perspective/pull/1547) ([texodus](https://github.com/texodus))
- Fix M1 \(Apple Silicon\) build for `perspective-python` and improve developer docs [\#1525](https://github.com/finos/perspective/pull/1525) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- `save` on a `perspective-viewer` emits `plugin: null` if the attribute hasnt been set, instead of using the active plugin \(e.g. datagrid\) [\#1501](https://github.com/finos/perspective/issues/1501)
- Scrolling in the Olympics example grids expands the table continuosly [\#1302](https://github.com/finos/perspective/issues/1302)
- table.replace + unique aggregate incorrectly sets values to 0 in datagrid [\#1175](https://github.com/finos/perspective/issues/1175)
- Heatmap doesn't work when dates are used in columns [\#1132](https://github.com/finos/perspective/issues/1132)
- Inconsistent UI when transposing Pivots [\#1021](https://github.com/finos/perspective/issues/1021)
- Fix \#1566, remove deprecated flags from WASM debug build [\#1567](https://github.com/finos/perspective/pull/1567) ([sc1f](https://github.com/sc1f))
- Fix \#1562, fix regressions in PerspectiveWidget [\#1565](https://github.com/finos/perspective/pull/1565) ([sc1f](https://github.com/sc1f))
- Fix python wheel CI [\#1552](https://github.com/finos/perspective/pull/1552) ([texodus](https://github.com/texodus))
- Long expressions block edit and delete buttons [\#1546](https://github.com/finos/perspective/issues/1546)
- Perspective Viewer does not type tag or filter for booleans [\#1544](https://github.com/finos/perspective/issues/1544)
- Incorrect type for Filters in Typescript perspective-viewer/index.d.ts [\#1517](https://github.com/finos/perspective/issues/1517)
- Perspective-viewer compilation error due to missing loader. [\#1497](https://github.com/finos/perspective/issues/1497)
- table.size\(\) incorrect after remove\(\) [\#1225](https://github.com/finos/perspective/issues/1225)
- `table.remove\(keys\)` from node seems to corrupt indexing? [\#998](https://github.com/finos/perspective/issues/998)
- Fix examples [\#1556](https://github.com/finos/perspective/pull/1556) ([texodus](https://github.com/texodus))
- Fix expression column button toolbar styling [\#1555](https://github.com/finos/perspective/pull/1555) ([texodus](https://github.com/texodus))
- Fix hidden sort aggregate as `unique` only when sorted on the same axis [\#1554](https://github.com/finos/perspective/pull/1554) ([texodus](https://github.com/texodus))
- Fixes `bucket\(\)` computed function validation [\#1551](https://github.com/finos/perspective/pull/1551) ([texodus](https://github.com/texodus))
- Fix 'weighted mean' aggregate support in \<perspective-viewer\> [\#1543](https://github.com/finos/perspective/pull/1543) ([texodus](https://github.com/texodus))
- Fix column section collapse with expressions [\#1542](https://github.com/finos/perspective/pull/1542) ([texodus](https://github.com/texodus))
- Fix `is \(not\) null`, `date`, `datetime` filters [\#1541](https://github.com/finos/perspective/pull/1541) ([texodus](https://github.com/texodus))
- Fix workspace filter events [\#1540](https://github.com/finos/perspective/pull/1540) ([texodus](https://github.com/texodus))
- Fix `docs` site and NPM artifact for `\<perspective-viewer\>` update [\#1533](https://github.com/finos/perspective/pull/1533) ([texodus](https://github.com/texodus))
- Fix drag/drop exclusive cases [\#1532](https://github.com/finos/perspective/pull/1532) ([texodus](https://github.com/texodus))
- Re-add `getEditPort\(\)` and `restyleElement\(\)` methods [\#1531](https://github.com/finos/perspective/pull/1531) ([texodus](https://github.com/texodus))
- Use TypeScript for `@finos/perspective-viewer` [\#1530](https://github.com/finos/perspective/pull/1530) ([texodus](https://github.com/texodus))
- Fix `settings` key to trigger redraw + container redraw [\#1529](https://github.com/finos/perspective/pull/1529) ([texodus](https://github.com/texodus))
- Fix \#1505, \#998, \#1225 - results after remove are correct [\#1528](https://github.com/finos/perspective/pull/1528) ([sc1f](https://github.com/sc1f))
- Fix D3FC chart resize via `preserveAspectRatio` [\#1526](https://github.com/finos/perspective/pull/1526) ([texodus](https://github.com/texodus))

**Closed issues:**

- Segfault with python 3.9 expressions [\#1572](https://github.com/finos/perspective/issues/1572)
- Loading remote table from Python breaks the viewer [\#1566](https://github.com/finos/perspective/issues/1566)
- PerspectiveWidget should init a shared\_worker and not a worker-per-widget [\#1562](https://github.com/finos/perspective/issues/1562)
- Perspective Viewer does not work in Custom Element Examples remote\_express and remote-express-typescript  [\#1536](https://github.com/finos/perspective/issues/1536)
- Perspective refuses to work with React with webpack 4.x [\#1512](https://github.com/finos/perspective/issues/1512)
- `bucket\(\)` expression doesn't validate when 0 or more than 1 space separate arguments [\#1550](https://github.com/finos/perspective/issues/1550)
- Records added via table.update do not appear in perspective viewer filter values [\#1535](https://github.com/finos/perspective/issues/1535)
- Inconsistent view output under frequent insert&delete [\#1505](https://github.com/finos/perspective/issues/1505)

**Merged pull requests:**

- `docs` for updated `perspective-viewer` [\#1574](https://github.com/finos/perspective/pull/1574) ([texodus](https://github.com/texodus))
- Make `/node\_modules` external to TS [\#1557](https://github.com/finos/perspective/pull/1557) ([texodus](https://github.com/texodus))
- Upgrade emscripten to 2.0.29 [\#1539](https://github.com/finos/perspective/pull/1539) ([texodus](https://github.com/texodus))
- Add docs for `\<perspective-viewer-plugin\>` [\#1538](https://github.com/finos/perspective/pull/1538) ([texodus](https://github.com/texodus))
- Lint upgrade and remove TypeScript for `@finos/perspective-jupyterlab` [\#1537](https://github.com/finos/perspective/pull/1537) ([texodus](https://github.com/texodus))
- add some light sdist tests and upload sdist in CI [\#1433](https://github.com/finos/perspective/pull/1433) ([timkpaine](https://github.com/timkpaine))

## [v0.10.3](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v0.10.2...HEAD)

**Fixed bugs:**

- Refactor `to\_arrow`, fix row deltas for pivoted views [\#1519](https://github.com/finos/perspective/pull/1519) ([sc1f](https://github.com/sc1f))
- Fix count aggregate when last aggregate and partial updates are applied [\#1518](https://github.com/finos/perspective/pull/1518) ([sc1f](https://github.com/sc1f))

## [v0.10.2](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v0.10.1...v0.10.2)

**Fixed bugs:**

- Filtering using `in` operator doesn't work as expected [\#1520](https://github.com/finos/perspective/issues/1520)
- Fix support for array-like filter terms [\#1524](https://github.com/finos/perspective/pull/1524) ([texodus](https://github.com/texodus))
- Add new aggregates to ViewConfig enum [\#1516](https://github.com/finos/perspective/pull/1516) ([sc1f](https://github.com/sc1f))

## [v0.10.1](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v0.10.0...v0.10.1)

**Implemented enhancements:**

- Feature request: Column Name aliasing [\#433](https://github.com/finos/perspective/issues/433)
- Multiple aggregates on same column [\#272](https://github.com/finos/perspective/issues/272)
- Add standard deviation and variance aggregates [\#1476](https://github.com/finos/perspective/pull/1476) ([sc1f](https://github.com/sc1f))
- Upgrade `regular-table` [\#1475](https://github.com/finos/perspective/pull/1475) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Remove filter limit [\#1514](https://github.com/finos/perspective/pull/1514) ([texodus](https://github.com/texodus))
- Add required dependencies for webpack plugin [\#1480](https://github.com/finos/perspective/pull/1480) ([LukeSheard](https://github.com/LukeSheard))
- Fix throttle attribute [\#1479](https://github.com/finos/perspective/pull/1479) ([texodus](https://github.com/texodus))

**Closed issues:**

- Unable to load @finos/perspective-jupyterlab:~0.10.0 [\#1502](https://github.com/finos/perspective/issues/1502)
- Unable to name an expression \(computed column\) [\#1493](https://github.com/finos/perspective/issues/1493)

**Merged pull requests:**

- Preload fonts [\#1481](https://github.com/finos/perspective/pull/1481) ([texodus](https://github.com/texodus))
- Refactoring [\#1471](https://github.com/finos/perspective/pull/1471) ([texodus](https://github.com/texodus))

## [v0.10.0](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v0.9.0...v0.10.0)

**Implemented enhancements:**

- Inlined build for perspective-jupyterlab, improve PerspectiveWidget [\#1466](https://github.com/finos/perspective/pull/1466) ([sc1f](https://github.com/sc1f))
- Spark bar [\#1459](https://github.com/finos/perspective/pull/1459) ([texodus](https://github.com/texodus))
- New plugin api [\#1457](https://github.com/finos/perspective/pull/1457) ([texodus](https://github.com/texodus))
- Read CSV strings in perspective-python [\#1447](https://github.com/finos/perspective/pull/1447) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- Perspective 0.7.0 and above does not work in Voila [\#1454](https://github.com/finos/perspective/issues/1454)
- PerspectiveWidget fails to init on ipywidgets \>=8.0.0 due to removed API [\#1340](https://github.com/finos/perspective/issues/1340)
- Fix Binder by updating Jupyterlab to 3.0.14 from 3.0.9 [\#1469](https://github.com/finos/perspective/pull/1469) ([sc1f](https://github.com/sc1f))
- Misc. plugin bug fixes [\#1465](https://github.com/finos/perspective/pull/1465) ([texodus](https://github.com/texodus))
- Fix memory errors when streaming updates with expression columns [\#1464](https://github.com/finos/perspective/pull/1464) ([sc1f](https://github.com/sc1f))
- Fixes \#1340 - removes dependency on removed ipywidgets API [\#1455](https://github.com/finos/perspective/pull/1455) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- react example not working with version 0.9.0  [\#1467](https://github.com/finos/perspective/issues/1467)
- Delta Updates [\#1300](https://github.com/finos/perspective/issues/1300)

**Merged pull requests:**

- New website [\#1470](https://github.com/finos/perspective/pull/1470) ([texodus](https://github.com/texodus))
- Add Jupyterlab tests to CI [\#1460](https://github.com/finos/perspective/pull/1460) ([texodus](https://github.com/texodus))
- Build Windows wheel, limit wheel builds to scheduled and tagged builds [\#1453](https://github.com/finos/perspective/pull/1453) ([sc1f](https://github.com/sc1f))

## [v0.9.0](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v0.8.3...HEAD)

**Breaking changes:**

- Add Expressions Engine using ExprTk [\#1354](https://github.com/finos/perspective/pull/1354) ([sc1f](https://github.com/sc1f))

**Implemented enhancements:**

- Expose `join` aggregate function to clients [\#1373](https://github.com/finos/perspective/issues/1373)
- Computed columns should accept scalars [\#1279](https://github.com/finos/perspective/issues/1279)
- Support Date to Number conversion to allow time difference calculations [\#1196](https://github.com/finos/perspective/issues/1196)
- Error reporting for `monaco` [\#1444](https://github.com/finos/perspective/pull/1444) ([texodus](https://github.com/texodus))
- Column name completion for `monaco` [\#1443](https://github.com/finos/perspective/pull/1443) ([texodus](https://github.com/texodus))
- Output more metadata on expression errors, fix \#1440 [\#1441](https://github.com/finos/perspective/pull/1441) ([sc1f](https://github.com/sc1f))
- Add integer, float, string, date, and datetime conversion functions [\#1437](https://github.com/finos/perspective/pull/1437) ([sc1f](https://github.com/sc1f))
- Isolate expressions per-context and ensure memory stability [\#1431](https://github.com/finos/perspective/pull/1431) ([sc1f](https://github.com/sc1f))
- Expression Editor UI via `monaco-editor` [\#1426](https://github.com/finos/perspective/pull/1426) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- get\_index\(\) method missing from Typescript Table type definition [\#1440](https://github.com/finos/perspective/issues/1440)
- Perspective expression editor broken on FireFox due to missing `getSelection` on shadow root [\#1328](https://github.com/finos/perspective/issues/1328)
- Parse aggregates in column order [\#1432](https://github.com/finos/perspective/pull/1432) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Can't install Perspective [\#1449](https://github.com/finos/perspective/issues/1449)
- Unable to install perspective-python on Mac OS 10.14 [\#1429](https://github.com/finos/perspective/issues/1429)
- yarn build failed for Javascript setup with error "Unrecognized Token" [\#1427](https://github.com/finos/perspective/issues/1427)
- Passing bytes to table  [\#1424](https://github.com/finos/perspective/issues/1424)
- Large image in README [\#1422](https://github.com/finos/perspective/issues/1422)
- Remove intermediate computed columns from "real" columns list [\#1278](https://github.com/finos/perspective/issues/1278)

**Merged pull requests:**

- Expression editor bug fixes [\#1450](https://github.com/finos/perspective/pull/1450) ([texodus](https://github.com/texodus))
- Update Jupyter Notebook Examples [\#1446](https://github.com/finos/perspective/pull/1446) ([sc1f](https://github.com/sc1f))
- Add theme support to monaco [\#1439](https://github.com/finos/perspective/pull/1439) ([texodus](https://github.com/texodus))
- Fix benchmarks and remove versions pre 0.5.0 from benchmarking [\#1436](https://github.com/finos/perspective/pull/1436) ([sc1f](https://github.com/sc1f))
- Optional lazy-load `monaco-editor` [\#1435](https://github.com/finos/perspective/pull/1435) ([texodus](https://github.com/texodus))
- Expose `join` aggregate [\#1434](https://github.com/finos/perspective/pull/1434) ([texodus](https://github.com/texodus))
- organize azure pipelines file [\#1381](https://github.com/finos/perspective/pull/1381) ([timkpaine](https://github.com/timkpaine))

## [v0.8.3](https://github.com/finos/perspective/tree/HEAD)

[Full Changelog](https://github.com/finos/perspective/compare/v0.8.2...HEAD)

**Merged pull requests:**

- Double-render fix [\#1420](https://github.com/finos/perspective/pull/1420) ([texodus](https://github.com/texodus))

## [v0.8.2](https://github.com/finos/perspective/tree/v0.8.2) (2021-05-11)

[Full Changelog](https://github.com/finos/perspective/compare/v0.8.1...v0.8.2)

**Fixed bugs:**

- Perspective-cli hosting error: input.on\_delete is not a function [\#1405](https://github.com/finos/perspective/issues/1405)
- Fix CLI `async` regression [\#1419](https://github.com/finos/perspective/pull/1419) ([texodus](https://github.com/texodus))
- Fix color gradient charts containing 0 [\#1418](https://github.com/finos/perspective/pull/1418) ([texodus](https://github.com/texodus))
- Fix styling bugs from CSS minification [\#1417](https://github.com/finos/perspective/pull/1417) ([texodus](https://github.com/texodus))

## [v0.8.1](https://github.com/finos/perspective/tree/v0.8.1) (2021-05-10)

[Full Changelog](https://github.com/finos/perspective/compare/v0.8.0...v0.8.1)

**Implemented enhancements:**

- More Material style updates [\#1416](https://github.com/finos/perspective/pull/1416) ([texodus](https://github.com/texodus))
- Color-by-string for Treemap/Sunburst [\#1415](https://github.com/finos/perspective/pull/1415) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Memory leak on reads from view, both on\_update and to\_json [\#1037](https://github.com/finos/perspective/issues/1037)
- Responsive column style menu [\#1414](https://github.com/finos/perspective/pull/1414) ([texodus](https://github.com/texodus))
- Fix memory leak\(s\), leak tests, `memory\_usage\(\)` wasm heap API [\#1412](https://github.com/finos/perspective/pull/1412) ([texodus](https://github.com/texodus))

**Closed issues:**

- Cannot find perspective\_vieux\_bg.wasm [\#1409](https://github.com/finos/perspective/issues/1409)
- React and webpack examples don't work [\#1403](https://github.com/finos/perspective/issues/1403)
- Unable to build the project in ubuntu environment. Getting 'Module not found: Error: Can't resolve '@finos/perspective' error [\#1401](https://github.com/finos/perspective/issues/1401)

**Merged pull requests:**

- Getting pybind version number always fails [\#1413](https://github.com/finos/perspective/pull/1413) ([nickpholden](https://github.com/nickpholden))
- Fix `react` and `remote-workspace` examples [\#1411](https://github.com/finos/perspective/pull/1411) ([texodus](https://github.com/texodus))
- Install Boost from JFrog, fix outdated docs from \#1409 [\#1410](https://github.com/finos/perspective/pull/1410) ([sc1f](https://github.com/sc1f))
- Upgrade `puppeteer` to `9.0.0` [\#1408](https://github.com/finos/perspective/pull/1408) ([texodus](https://github.com/texodus))

## [v0.8.0](https://github.com/finos/perspective/tree/v0.8.0) (2021-04-27)

[Full Changelog](https://github.com/finos/perspective/compare/v0.7.0...v0.8.0)

**Breaking changes:**

- Add `get\_min\_max\(\)` to Perspective API [\#1395](https://github.com/finos/perspective/pull/1395) ([texodus](https://github.com/texodus))

**Implemented enhancements:**

- Datagrid Styleable Column [\#1386](https://github.com/finos/perspective/pull/1386) ([texodus](https://github.com/texodus))
- Enable editing to mime renderer in JupyterLab [\#1353](https://github.com/finos/perspective/pull/1353) ([timkpaine](https://github.com/timkpaine))

**Fixed bugs:**

- jupyter widget x-axis [\#1389](https://github.com/finos/perspective/issues/1389)
- Exception in Widget console [\#984](https://github.com/finos/perspective/issues/984)
- Fix `last` aggregate to preserve status [\#1390](https://github.com/finos/perspective/pull/1390) ([texodus](https://github.com/texodus))

**Closed issues:**

- API docs are returning 404 [\#1398](https://github.com/finos/perspective/issues/1398)
- PerspectiveWidget gets in unrecoverable state [\#1397](https://github.com/finos/perspective/issues/1397)
- Cant get PerspectiveWidget loaded in jupyter lab [\#1392](https://github.com/finos/perspective/issues/1392)
- Jupyter labextension install does not work on master [\#1330](https://github.com/finos/perspective/issues/1330)
- Olympics example still referring to hypergrid [\#1304](https://github.com/finos/perspective/issues/1304)
- Custom styles example not showing anything [\#1303](https://github.com/finos/perspective/issues/1303)

**Merged pull requests:**

- Updated `gh-pages` site and `README.md` [\#1399](https://github.com/finos/perspective/pull/1399) ([texodus](https://github.com/texodus))
- Disable column style menu for non-numeric columns [\#1391](https://github.com/finos/perspective/pull/1391) ([texodus](https://github.com/texodus))

## [v0.7.0](https://github.com/finos/perspective/tree/v0.7.0) (2021-04-20)

[Full Changelog](https://github.com/finos/perspective/compare/v0.6.2...v0.7.0)

**Breaking changes:**

- Remove webcomponentsjs [\#1388](https://github.com/finos/perspective/pull/1388) ([texodus](https://github.com/texodus))
- Async Table and View Constructor [\#1289](https://github.com/finos/perspective/pull/1289) ([sc1f](https://github.com/sc1f))

**Implemented enhancements:**

- Material Theme 2.0 [\#1380](https://github.com/finos/perspective/pull/1380) ([texodus](https://github.com/texodus))
- Add `call\_loop` and `get\_table\_names` [\#1375](https://github.com/finos/perspective/pull/1375) ([sc1f](https://github.com/sc1f))
- Deprecate py27 \(linux\), add py39 \(osx\) [\#1336](https://github.com/finos/perspective/pull/1336) ([timkpaine](https://github.com/timkpaine))
- Status Bar Component [\#1314](https://github.com/finos/perspective/pull/1314) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Binder link in README is broken [\#1339](https://github.com/finos/perspective/issues/1339)
- Python wheel builds failing on catalina for py36 and py38 [\#1334](https://github.com/finos/perspective/issues/1334)
- `perspective-python` should not use tilde \(~\) in client version resolution [\#1324](https://github.com/finos/perspective/issues/1324)
- Inconsistent property names for ViewConfig [\#1079](https://github.com/finos/perspective/issues/1079)
- issue running tests on Windows 7 [\#1051](https://github.com/finos/perspective/issues/1051)
- Segmentation fault due to TBB when \> 8 clients are connected to a Python table [\#1007](https://github.com/finos/perspective/issues/1007)

**Closed issues:**

- Jupyter notebook wont display widget [\#1385](https://github.com/finos/perspective/issues/1385)
- How to best notify existing Perspective Github community of upcoming events? [\#1357](https://github.com/finos/perspective/issues/1357)
- collapse row pivots on data grid by default [\#1356](https://github.com/finos/perspective/issues/1356)
- How to catch abort errors in JavaScript? [\#1348](https://github.com/finos/perspective/issues/1348)
- Upload of v0.6.2 to PyPI? [\#1333](https://github.com/finos/perspective/issues/1333)
- What is the correct way to unmount / cleanup the components? [\#1329](https://github.com/finos/perspective/issues/1329)
- Webpack plugin fails in a fresh Next.js app [\#1316](https://github.com/finos/perspective/issues/1316)
- Crash on Async Mode / GIL release [\#1313](https://github.com/finos/perspective/issues/1313)
- Add periodic testing to CI [\#1267](https://github.com/finos/perspective/issues/1267)
- Referencing perspective-workspace from index.html complains about perspective-row being already used [\#1218](https://github.com/finos/perspective/issues/1218)

**Merged pull requests:**

- Fix cross-origin webpack defaults [\#1387](https://github.com/finos/perspective/pull/1387) ([texodus](https://github.com/texodus))
- Backwards compatibility for table\(\) and view\(\) [\#1384](https://github.com/finos/perspective/pull/1384) ([sc1f](https://github.com/sc1f))
- Adds `yarn repl` to launch a shell inside our docker images [\#1382](https://github.com/finos/perspective/pull/1382) ([sc1f](https://github.com/sc1f))
- Update regular-table to 0.3.1 [\#1379](https://github.com/finos/perspective/pull/1379) ([texodus](https://github.com/texodus))
- Fix `@finos/perspective-jupyterlab` to work with WebAssembly/Webpack5 [\#1377](https://github.com/finos/perspective/pull/1377) ([texodus](https://github.com/texodus))
- install boost via choco [\#1351](https://github.com/finos/perspective/pull/1351) ([timkpaine](https://github.com/timkpaine))
- Fix timezone tests to take DST into account [\#1349](https://github.com/finos/perspective/pull/1349) ([sc1f](https://github.com/sc1f))
- Fix D3FC label font bug [\#1343](https://github.com/finos/perspective/pull/1343) ([texodus](https://github.com/texodus))
- Replace `emsdk-npm` with simple script [\#1342](https://github.com/finos/perspective/pull/1342) ([texodus](https://github.com/texodus))
- fix binder [\#1341](https://github.com/finos/perspective/pull/1341) ([timkpaine](https://github.com/timkpaine))
- Add nightly complete builds [\#1338](https://github.com/finos/perspective/pull/1338) ([timkpaine](https://github.com/timkpaine))
- Fix \#1324: use ~major.minor.patch in PerspectiveWidget versioning [\#1331](https://github.com/finos/perspective/pull/1331) ([sc1f](https://github.com/sc1f))
- Add `SplitPanel` and port to Yew [\#1326](https://github.com/finos/perspective/pull/1326) ([texodus](https://github.com/texodus))

## [v0.6.2](https://github.com/finos/perspective/tree/v0.6.2) (2021-02-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.6.1...v0.6.2)

**Fixed bugs:**

- Fix `@finos/perspective-jupyterlab` compat with webpack5 [\#1323](https://github.com/finos/perspective/pull/1323) ([texodus](https://github.com/texodus))

## [v0.6.1](https://github.com/finos/perspective/tree/v0.6.1) (2021-02-11)

[Full Changelog](https://github.com/finos/perspective/compare/v0.6.0...v0.6.1)

**Implemented enhancements:**

- Bump JupyterLab support for 3.0 now that it is released [\#1269](https://github.com/finos/perspective/issues/1269)
- Provide human-readable dates \(optionally?\) from Perspective `to\_csv\(\)` method [\#524](https://github.com/finos/perspective/issues/524)
- Date/datetime filter autocompletion, new timezone test suite for JS [\#1282](https://github.com/finos/perspective/pull/1282) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- Sorting a column aggregated by `avg` does not sort [\#1285](https://github.com/finos/perspective/issues/1285)
- Inconsistency with table.update\(\) in Python with Dicts [\#1268](https://github.com/finos/perspective/issues/1268)
- Py36 environment in azure fails on tag build due to old pip [\#1244](https://github.com/finos/perspective/issues/1244)
- Datetime and date `==` filters does not work as expected [\#1242](https://github.com/finos/perspective/issues/1242)
- Changing tables in viewer & unhandled exception server side [\#909](https://github.com/finos/perspective/issues/909)
- Perspective Viewer view dropdowns in dark theme need bg and text color CSS change [\#592](https://github.com/finos/perspective/issues/592)
- Long column names make Hypergrid view unreadable [\#554](https://github.com/finos/perspective/issues/554)
- `--toggle-puppeteer` does not work on Windows [\#513](https://github.com/finos/perspective/issues/513)
- Fix missing return in ctx0::notify [\#1320](https://github.com/finos/perspective/pull/1320) ([sc1f](https://github.com/sc1f))
- Fix for layout jitter in the Column Selector [\#1318](https://github.com/finos/perspective/pull/1318) ([texodus](https://github.com/texodus))
- Remove webpack as a peerDependency for the webpack plugin [\#1311](https://github.com/finos/perspective/pull/1311) ([threepointone](https://github.com/threepointone))
- Fix partial updates in Python using dicts [\#1298](https://github.com/finos/perspective/pull/1298) ([sc1f](https://github.com/sc1f))
- Fixes style issue with \<select\> dark theme on Windows [\#1287](https://github.com/finos/perspective/pull/1287) ([texodus](https://github.com/texodus))
- Fix for sorting via `avg` aggregated column. [\#1286](https://github.com/finos/perspective/pull/1286) ([texodus](https://github.com/texodus))

**Closed issues:**

- How to destroy perspective worker? [\#1317](https://github.com/finos/perspective/issues/1317)
- Installation problem [\#1315](https://github.com/finos/perspective/issues/1315)
- Building Jupyterlab plugin from source does not pull working directory changes [\#1299](https://github.com/finos/perspective/issues/1299)
- JupyterLab Renderer broken on 0.6.0 [\#1296](https://github.com/finos/perspective/issues/1296)
- Typescript no longer being linted  [\#1295](https://github.com/finos/perspective/issues/1295)
- perspective-python crash [\#1168](https://github.com/finos/perspective/issues/1168)

**Merged pull requests:**

- Export inline `@finos/perspective` by default, and simplify some package `dist` with rollup [\#1322](https://github.com/finos/perspective/pull/1322) ([texodus](https://github.com/texodus))
- Update regular-table to 0.2.1 [\#1321](https://github.com/finos/perspective/pull/1321) ([texodus](https://github.com/texodus))
- Docs site updates [\#1319](https://github.com/finos/perspective/pull/1319) ([texodus](https://github.com/texodus))
- Add `jlab\_link` script to link local changes into development Jupyterlab [\#1309](https://github.com/finos/perspective/pull/1309) ([sc1f](https://github.com/sc1f))
- JupyterLab update to ^3.0.0, and fix "Open With.." regression [\#1294](https://github.com/finos/perspective/pull/1294) ([timkpaine](https://github.com/timkpaine))
- Removed dead code from C++ src [\#1293](https://github.com/finos/perspective/pull/1293) ([texodus](https://github.com/texodus))
- Add `@finos/perspective-cpp` module [\#1292](https://github.com/finos/perspective/pull/1292) ([texodus](https://github.com/texodus))
- Statically link `perspective-python` and `libarrow` [\#1290](https://github.com/finos/perspective/pull/1290) ([sc1f](https://github.com/sc1f))
- Fix \#1244: make test\_wheels script use python -m pip [\#1288](https://github.com/finos/perspective/pull/1288) ([sc1f](https://github.com/sc1f))
- Upgrade Emscripten to 2.0.6 and remove emsdk docker image [\#1232](https://github.com/finos/perspective/pull/1232) ([texodus](https://github.com/texodus))

## [v0.6.0](https://github.com/finos/perspective/tree/v0.6.0) (2021-01-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.5.6...v0.6.0)

**Breaking changes:**

- Remove host\_view and open\_view from public API [\#1240](https://github.com/finos/perspective/pull/1240) ([sc1f](https://github.com/sc1f))
- Restrict `viewer.load\(\)` to only accept `Table\(\)` [\#1231](https://github.com/finos/perspective/pull/1231) ([texodus](https://github.com/texodus))

**Implemented enhancements:**

- Improve the behavior of the render warning on charts [\#1213](https://github.com/finos/perspective/issues/1213)
- Feature request: Add abs sum as an aggregator [\#750](https://github.com/finos/perspective/issues/750)
- Validate view config in engine, fix computed column state bugs [\#1272](https://github.com/finos/perspective/pull/1272) ([sc1f](https://github.com/sc1f))
- Fix \#1213 - improve render warning behavior [\#1249](https://github.com/finos/perspective/pull/1249) ([sc1f](https://github.com/sc1f))
- Reimplement pandas deconstruction [\#1238](https://github.com/finos/perspective/pull/1238) ([timkpaine](https://github.com/timkpaine))
- Add unit context for 0-sided views [\#1235](https://github.com/finos/perspective/pull/1235) ([sc1f](https://github.com/sc1f))
- Add Python client-based stresstest [\#1223](https://github.com/finos/perspective/pull/1223) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- FindPyarrow.cmake should check if major version != 0, not if ==1 [\#1259](https://github.com/finos/perspective/issues/1259)
- Perspective Python build failure when executing yarn run build\_python [\#1258](https://github.com/finos/perspective/issues/1258)
- Filter options are not converted to json-serializeable values [\#1243](https://github.com/finos/perspective/issues/1243)
- Date columns break in PerspectiveWidget client mode [\#1241](https://github.com/finos/perspective/issues/1241)
- Perspective-Python does not support DataFrames with categorical axis [\#1158](https://github.com/finos/perspective/issues/1158)
- Critical error for pandas pivoted data frames [\#1123](https://github.com/finos/perspective/issues/1123)
- Inconsistent behavior for Pandas pivot tables [\#1122](https://github.com/finos/perspective/issues/1122)
- Fix Date/Time formatting in `perspective-viewer` CSV output [\#1281](https://github.com/finos/perspective/pull/1281) ([texodus](https://github.com/texodus))
- Fix build for pyarrow 2.0.0 [\#1260](https://github.com/finos/perspective/pull/1260) ([timkpaine](https://github.com/timkpaine))
- Fix \#1241 - date and datetime values in client mode are parsed properly [\#1248](https://github.com/finos/perspective/pull/1248) ([sc1f](https://github.com/sc1f))
- Fix distributed editing in PerspectiveWidget [\#1236](https://github.com/finos/perspective/pull/1236) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Dataframe copy / dump to csv from perspective datetime formatting [\#1265](https://github.com/finos/perspective/issues/1265)
- Defining calculated column using 'final aggregate column values' [\#1263](https://github.com/finos/perspective/issues/1263)
- Pandas on the web browser with perspective? [\#1254](https://github.com/finos/perspective/issues/1254)
- All API documentation links broken [\#1229](https://github.com/finos/perspective/issues/1229)
- More Recent Conda Builds [\#1226](https://github.com/finos/perspective/issues/1226)

**Merged pull requests:**

- New Documentation & Project Site [\#1275](https://github.com/finos/perspective/pull/1275) ([texodus](https://github.com/texodus))
- free\(\) pointer to arrow binary in Python [\#1273](https://github.com/finos/perspective/pull/1273) ([sc1f](https://github.com/sc1f))
- Cleanup docs and examples to viewer.load\(table\) [\#1271](https://github.com/finos/perspective/pull/1271) ([sc1f](https://github.com/sc1f))
- Fix: version conflict that makes `npm install` failed [\#1266](https://github.com/finos/perspective/pull/1266) ([damphat](https://github.com/damphat))
- Fix flapping tests for render warnings [\#1264](https://github.com/finos/perspective/pull/1264) ([texodus](https://github.com/texodus))
- Documentation: Point to current jupyter examples, and remove out-of-date/broken example [\#1257](https://github.com/finos/perspective/pull/1257) ([ceball](https://github.com/ceball))
- Update Azure Windows boost to 1.72 [\#1253](https://github.com/finos/perspective/pull/1253) ([sc1f](https://github.com/sc1f))
- Add perspective-click event to grid [\#1250](https://github.com/finos/perspective/pull/1250) ([Sam-Ogden](https://github.com/Sam-Ogden))
- Adding abs sum functionality [\#1247](https://github.com/finos/perspective/pull/1247) ([zepaz](https://github.com/zepaz))
- Fix example notebooks [\#1239](https://github.com/finos/perspective/pull/1239) ([sc1f](https://github.com/sc1f))
- tweak py wheel build on linux [\#1234](https://github.com/finos/perspective/pull/1234) ([timkpaine](https://github.com/timkpaine))
- Refactor C++, misc. C++ fixes [\#1233](https://github.com/finos/perspective/pull/1233) ([sc1f](https://github.com/sc1f))
- Add `get\_index\(\)` and `get\_limit\(\)` to the public API, internal code cleanup [\#1230](https://github.com/finos/perspective/pull/1230) ([sc1f](https://github.com/sc1f))
- Explicitly import `tornado.locks` [\#1227](https://github.com/finos/perspective/pull/1227) ([sc1f](https://github.com/sc1f))

## [v0.5.6](https://github.com/finos/perspective/tree/v0.5.6) (2020-10-15)

[Full Changelog](https://github.com/finos/perspective/compare/v0.5.5...v0.5.6)

**Implemented enhancements:**

- adding binder link [\#1217](https://github.com/finos/perspective/pull/1217) ([timkpaine](https://github.com/timkpaine))
- Add `perspective-plugin-update` event for d3fc [\#1212](https://github.com/finos/perspective/pull/1212) ([zemeolotu](https://github.com/zemeolotu))
- Send large arrow binaries as chunks, add client-level Websocket heartbeat [\#1209](https://github.com/finos/perspective/pull/1209) ([sc1f](https://github.com/sc1f))
- Upgrade WebAssembly build to Arrow 1.0.1 [\#1207](https://github.com/finos/perspective/pull/1207) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Fix infinite loop bug in 2-sided context [\#1219](https://github.com/finos/perspective/pull/1219) ([texodus](https://github.com/texodus))
- Fix `computed-column` and `table\(\)` constructor Javascript bugs [\#1214](https://github.com/finos/perspective/pull/1214) ([texodus](https://github.com/texodus))

**Closed issues:**

- Can we set custom property on perspective viewer ?  [\#1222](https://github.com/finos/perspective/issues/1222)
- Jupyter integration demo [\#1210](https://github.com/finos/perspective/issues/1210)

**Merged pull requests:**

- Separate 'release' and 'debug' builds [\#1221](https://github.com/finos/perspective/pull/1221) ([texodus](https://github.com/texodus))
- C++ Datetime Parsing [\#1220](https://github.com/finos/perspective/pull/1220) ([texodus](https://github.com/texodus))
- fix broken link to apache arrow [\#1211](https://github.com/finos/perspective/pull/1211) ([gidsg](https://github.com/gidsg))
- Fix typo, update arrow version info.  [\#1204](https://github.com/finos/perspective/pull/1204) ([timkpaine](https://github.com/timkpaine))
- Improve Python Examples [\#1197](https://github.com/finos/perspective/pull/1197) ([sc1f](https://github.com/sc1f))

## [v0.5.5](https://github.com/finos/perspective/tree/v0.5.5) (2020-09-21)

[Full Changelog](https://github.com/finos/perspective/compare/v0.5.3...v0.5.5)

**Implemented enhancements:**

- Release GIL for `Table` methods [\#1202](https://github.com/finos/perspective/pull/1202) ([texodus](https://github.com/texodus))
- Add Python client implementation [\#1199](https://github.com/finos/perspective/pull/1199) ([sc1f](https://github.com/sc1f))
- GIL release for perspective-python Async mode [\#1198](https://github.com/finos/perspective/pull/1198) ([texodus](https://github.com/texodus))
- Server mode for Jupyterlab `PerspectiveWidget` [\#1195](https://github.com/finos/perspective/pull/1195) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Mac wheels defaulting to azure-specific python paths [\#1170](https://github.com/finos/perspective/issues/1170)
- Webpack Example does not build [\#1149](https://github.com/finos/perspective/issues/1149)
- Chromium browser doesn't load perspective.wasm.worker.js in Python remote.py/remote.html example [\#1139](https://github.com/finos/perspective/issues/1139)
- Dates are not displayed correctly in columns \(but just fine in rows\) [\#1131](https://github.com/finos/perspective/issues/1131)
- Table won't scroll in Firefox [\#1125](https://github.com/finos/perspective/issues/1125)
- link error during pip installation [\#1108](https://github.com/finos/perspective/issues/1108)
- Upgrade to regular-table 0.1.5 and fix custom-style example [\#1203](https://github.com/finos/perspective/pull/1203) ([texodus](https://github.com/texodus))
- `perspective-python` Client fixes [\#1200](https://github.com/finos/perspective/pull/1200) ([texodus](https://github.com/texodus))
- Remove linking against python [\#1194](https://github.com/finos/perspective/pull/1194) ([timkpaine](https://github.com/timkpaine))

**Closed issues:**

- Serious security vulnerability in dependency: highcharts \< 8.1.1 [\#1106](https://github.com/finos/perspective/issues/1106)

**Merged pull requests:**

- add some build troubleshooting docs [\#1193](https://github.com/finos/perspective/pull/1193) ([timkpaine](https://github.com/timkpaine))
- Bl.ocks [\#1191](https://github.com/finos/perspective/pull/1191) ([texodus](https://github.com/texodus))
- Use `black` Python format [\#1188](https://github.com/finos/perspective/pull/1188) ([texodus](https://github.com/texodus))
- Move Python examples to `/examples/` [\#1178](https://github.com/finos/perspective/pull/1178) ([texodus](https://github.com/texodus))

## [v0.5.3](https://github.com/finos/perspective/tree/v0.5.3) (2020-09-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.5.2...v0.5.3)

**Implemented enhancements:**

- Sort plugin names so that different plugins with same-named chart types show up in the same relative order [\#1130](https://github.com/finos/perspective/issues/1130)
- Register as widget on jupyter.org [\#1026](https://github.com/finos/perspective/issues/1026)
- Add websocket stresstests for Tornado server [\#1177](https://github.com/finos/perspective/pull/1177) ([sc1f](https://github.com/sc1f))
- `perspective-viewer-datagrid` support for `editable` [\#1176](https://github.com/finos/perspective/pull/1176) ([texodus](https://github.com/texodus))
- Remove deprecated plugins [\#1174](https://github.com/finos/perspective/pull/1174) ([texodus](https://github.com/texodus))
- Add `d3fc` X/Y Line Chart [\#1172](https://github.com/finos/perspective/pull/1172) ([texodus](https://github.com/texodus))
- Updated `@finos/perspective-viewer-datagrid` plugin to `regular-table` 0.0.9 [\#1169](https://github.com/finos/perspective/pull/1169) ([texodus](https://github.com/texodus))
- Fixes \#1159 - deltas are now generated on first update for 0-sided contexts [\#1164](https://github.com/finos/perspective/pull/1164) ([sc1f](https://github.com/sc1f))
- fix for virtualenvs/envs with multiple py3 installed, allow for up to arrow 0.17 [\#1163](https://github.com/finos/perspective/pull/1163) ([timkpaine](https://github.com/timkpaine))
- Submit tornado write\_message to IOLoop, add websocket tests in Python [\#1156](https://github.com/finos/perspective/pull/1156) ([sc1f](https://github.com/sc1f))
- Adds PR templates for bugfix, documentation, and feature [\#1155](https://github.com/finos/perspective/pull/1155) ([sc1f](https://github.com/sc1f))
- Adds `set\_threadpool\_size\(\)` [\#1147](https://github.com/finos/perspective/pull/1147) ([texodus](https://github.com/texodus))
- Generate/test Manylinux wheels, clean up wheel/build process [\#1105](https://github.com/finos/perspective/pull/1105) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- CMake picking up different paths for Python executable, libs, includes, not respecting version var [\#1162](https://github.com/finos/perspective/issues/1162)
- Arrow import failed after successfully building the library on Ubuntu 20.04 [\#1160](https://github.com/finos/perspective/issues/1160)
- Row delta is empty when table created from schema is first updated [\#1159](https://github.com/finos/perspective/issues/1159)
- Heatmap datetime pivots show POSIX timestamps and not formatted datetimes [\#1144](https://github.com/finos/perspective/issues/1144)
- Getting get\_data\_slice\_zero\(\): incompatible function arguments when changing viewer to Datagrid plugin [\#1115](https://github.com/finos/perspective/issues/1115)
- Datagrid overdraw fix [\#1187](https://github.com/finos/perspective/pull/1187) ([texodus](https://github.com/texodus))
- D3FC render fixes [\#1186](https://github.com/finos/perspective/pull/1186) ([texodus](https://github.com/texodus))
- Fix sticky dragdrop on `perspective-viewer` [\#1185](https://github.com/finos/perspective/pull/1185) ([texodus](https://github.com/texodus))
- `promo` example project update and computed function fix [\#1184](https://github.com/finos/perspective/pull/1184) ([texodus](https://github.com/texodus))
- `perspective-workspace` CSS fixes [\#1183](https://github.com/finos/perspective/pull/1183) ([texodus](https://github.com/texodus))
- Fix `perspective-viewer-datagrid` sorting [\#1181](https://github.com/finos/perspective/pull/1181) ([texodus](https://github.com/texodus))
- fix\(perspective-viewer-d3fc\): show formatted dates on treemap and sunburst \(1144\) [\#1165](https://github.com/finos/perspective/pull/1165) ([Sam-Ogden](https://github.com/Sam-Ogden))
- Fix segfault and errors on 2-sided sorted views when data window is invalid [\#1153](https://github.com/finos/perspective/pull/1153) ([sc1f](https://github.com/sc1f))
- Fix \#1129 and \#1130, remove Highcharts and Hypergrid from PerspectiveWidget [\#1142](https://github.com/finos/perspective/pull/1142) ([sc1f](https://github.com/sc1f))
- Fix path resolution for cross-origin assets [\#1141](https://github.com/finos/perspective/pull/1141) ([texodus](https://github.com/texodus))
- Enable updates from arrows that have more/less columns than the Table schema [\#1140](https://github.com/finos/perspective/pull/1140) ([sc1f](https://github.com/sc1f))
- Fix issue where contexts were being notified before gnode state was updated [\#1136](https://github.com/finos/perspective/pull/1136) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- http://localhost service worker error [\#1179](https://github.com/finos/perspective/issues/1179)
- How to Customizing behavior of perspective with perspective.config.js [\#1151](https://github.com/finos/perspective/issues/1151)
- Webpack Example Has Layout Glitch [\#1150](https://github.com/finos/perspective/issues/1150)
- Webpack Example does not build [\#1148](https://github.com/finos/perspective/issues/1148)
- Developer Guide seems out of date on emscripten version. [\#1121](https://github.com/finos/perspective/issues/1121)
- Source map error; error : request failed [\#1013](https://github.com/finos/perspective/issues/1013)

**Merged pull requests:**

- Updated development.md to show correct Emscripten version. [\#1138](https://github.com/finos/perspective/pull/1138) ([morgannavarro](https://github.com/morgannavarro))

## [v0.5.2](https://github.com/finos/perspective/tree/v0.5.2) (2020-07-28)

[Full Changelog](https://github.com/finos/perspective/compare/v0.5.1...v0.5.2)

**Implemented enhancements:**

- slight UX change, dont end with stack trace as it looks like it raise… [\#1110](https://github.com/finos/perspective/pull/1110) ([timkpaine](https://github.com/timkpaine))

**Fixed bugs:**

- Properly display computed axis on charts, use local time for all datetime functions [\#1116](https://github.com/finos/perspective/pull/1116) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- does it need default imports of perspective-viewer  [\#1107](https://github.com/finos/perspective/issues/1107)
- Can't create bare Dockerfile image with pyarrow==0.15.1 and perspective-python [\#966](https://github.com/finos/perspective/issues/966)

**Merged pull requests:**

- `perspective-viewer-highcharts-lite` [\#1135](https://github.com/finos/perspective/pull/1135) ([texodus](https://github.com/texodus))
- Fix transferable list in worker.postMessage [\#1119](https://github.com/finos/perspective/pull/1119) ([sc1f](https://github.com/sc1f))
- Explicitly floor start row/col and ceil end row/col [\#1112](https://github.com/finos/perspective/pull/1112) ([sc1f](https://github.com/sc1f))
- Add client/server editing example, fix hypergrid to allow editing in workspace [\#1109](https://github.com/finos/perspective/pull/1109) ([sc1f](https://github.com/sc1f))
- Fixed Typos in Perspective API Docs [\#1096](https://github.com/finos/perspective/pull/1096) ([panda311](https://github.com/panda311))

## [v0.5.1](https://github.com/finos/perspective/tree/v0.5.1) (2020-06-25)

[Full Changelog](https://github.com/finos/perspective/compare/v0.5.0...v0.5.1)

**Implemented enhancements:**

- Computed expressions respect left-to-right associativity and operator precedence [\#1090](https://github.com/finos/perspective/pull/1090) ([sc1f](https://github.com/sc1f))
- Replace all CRLF endings with LF [\#1082](https://github.com/finos/perspective/pull/1082) ([sc1f](https://github.com/sc1f))
- Fix for CRLF issue  [\#1078](https://github.com/finos/perspective/pull/1078) ([darjama](https://github.com/darjama))
- Use `regular-table` [\#1060](https://github.com/finos/perspective/pull/1060) ([texodus](https://github.com/texodus))
- Enable Manylinux wheel builds [\#1057](https://github.com/finos/perspective/pull/1057) ([sc1f](https://github.com/sc1f))
- add perspective-update-complete event example to js guide [\#1027](https://github.com/finos/perspective/pull/1027) ([jspillers](https://github.com/jspillers))

**Fixed bugs:**

- date columns with 'unique' aggregate breaks datagrid plugin  [\#1097](https://github.com/finos/perspective/issues/1097)
- Incorrect Values Rendered with uint8 Column on Datagrid [\#1084](https://github.com/finos/perspective/issues/1084)
- Expressions do not support associativity as expected [\#1072](https://github.com/finos/perspective/issues/1072)
- `unique` aggregate on datetime columns breaks pivoted datagrid [\#1068](https://github.com/finos/perspective/issues/1068)
- Typo in the documentation [\#1056](https://github.com/finos/perspective/issues/1056)
- repo contains 107 files with windows CRLF line endings [\#1024](https://github.com/finos/perspective/issues/1024)
- Fix Windows build on Azure [\#1095](https://github.com/finos/perspective/pull/1095) ([sc1f](https://github.com/sc1f))
- Use local time for column/row headers and computed functions [\#1074](https://github.com/finos/perspective/pull/1074) ([sc1f](https://github.com/sc1f))
- Fix regression in regex for Firefox [\#1065](https://github.com/finos/perspective/pull/1065) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Warnings in Command Prompt caused by the cmd 'npm install' [\#1073](https://github.com/finos/perspective/issues/1073)
- Does perspective have a maximum frequency at which the table can be updated? [\#1061](https://github.com/finos/perspective/issues/1061)
- Random strange number appearing in columns [\#1059](https://github.com/finos/perspective/issues/1059)

**Merged pull requests:**

- Unpin arrow version [\#1104](https://github.com/finos/perspective/pull/1104) ([sc1f](https://github.com/sc1f))
- Fix \#1068 [\#1103](https://github.com/finos/perspective/pull/1103) ([texodus](https://github.com/texodus))
- Spelling and grammar corrections [\#1094](https://github.com/finos/perspective/pull/1094) ([Shubham-1999](https://github.com/Shubham-1999))
- Spell-Fix [\#1093](https://github.com/finos/perspective/pull/1093) ([Yash1622](https://github.com/Yash1622))
- Cleans up CMakeLists & Python build scripts, fixes datetime string rendering [\#1091](https://github.com/finos/perspective/pull/1091) ([sc1f](https://github.com/sc1f))
- Spelling fixes [\#1083](https://github.com/finos/perspective/pull/1083) ([WinstonPais](https://github.com/WinstonPais))
- Bump websocket-extensions from 0.1.3 to 0.1.4 [\#1080](https://github.com/finos/perspective/pull/1080) ([dependabot[bot]](https://github.com/apps/dependabot))
- Refactor manager internal API, speed up string filters in UI,  add manager API tests [\#1077](https://github.com/finos/perspective/pull/1077) ([sc1f](https://github.com/sc1f))
- Run ESLint on documentation + minor documentation improvements [\#1069](https://github.com/finos/perspective/pull/1069) ([sc1f](https://github.com/sc1f))
- Fixed typo on documentation page [\#1062](https://github.com/finos/perspective/pull/1062) ([Snigdhabhatnagar](https://github.com/Snigdhabhatnagar))
- Remap lab extension command in makefile [\#1046](https://github.com/finos/perspective/pull/1046) ([timkpaine](https://github.com/timkpaine))

## [v0.5.0](https://github.com/finos/perspective/tree/v0.5.0) (2020-05-24)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.8...v0.5.0)

**Implemented enhancements:**

- Autocomplete [\#1052](https://github.com/finos/perspective/pull/1052) ([sc1f](https://github.com/sc1f))
- Implement Client/Server Editing [\#1043](https://github.com/finos/perspective/pull/1043) ([sc1f](https://github.com/sc1f))
- Expression-based Computed Columns [\#983](https://github.com/finos/perspective/pull/983) ([sc1f](https://github.com/sc1f))
- Reference python objects directly in perspective tables [\#975](https://github.com/finos/perspective/pull/975) ([timkpaine](https://github.com/timkpaine))

**Fixed bugs:**

- perspective-workspace is broken in Firefox [\#988](https://github.com/finos/perspective/issues/988)
- Fix flapping `perspective-workspace` tests [\#1022](https://github.com/finos/perspective/pull/1022) ([texodus](https://github.com/texodus))

**Closed issues:**

- Why do data from column data swap position in certain row and / How to update data effectively while streaming [\#1054](https://github.com/finos/perspective/issues/1054)
- Streaming issue [\#1050](https://github.com/finos/perspective/issues/1050)
- I keep getting error column\_path not defined, can anyone help me please  [\#1049](https://github.com/finos/perspective/issues/1049)
- Examples currently broken/wont load in firefox [\#1047](https://github.com/finos/perspective/issues/1047)
- Yarn build fails [\#1045](https://github.com/finos/perspective/issues/1045)
- Error activating Perspective from Mac Terminal [\#1042](https://github.com/finos/perspective/issues/1042)
- @finos/perspective-jupyterlab fails auto procurement due to 2 dependency issues [\#1036](https://github.com/finos/perspective/issues/1036)
- Chart Readability [\#1020](https://github.com/finos/perspective/issues/1020)
- Readability in DataManipulator.ts  email -  /ezeaninewton1@gmail.com/ [\#1019](https://github.com/finos/perspective/issues/1019)
- Please provide minimum example with perspective-viewer only using %%HTML in Notebook [\#1016](https://github.com/finos/perspective/issues/1016)
- Monospace font for hypergrid [\#1008](https://github.com/finos/perspective/issues/1008)

**Merged pull requests:**

- Styleable scroll-area for `@finos/perspective-viewer-datagrid` [\#1058](https://github.com/finos/perspective/pull/1058) ([texodus](https://github.com/texodus))
- Restore firefox support by removing captrue group from regex pattern [\#1048](https://github.com/finos/perspective/pull/1048) ([telamonian](https://github.com/telamonian))
- Remove duplicate `psp\_okey` column from arrow updates [\#1044](https://github.com/finos/perspective/pull/1044) ([sc1f](https://github.com/sc1f))
- Adds jsdelivr package.json metadata [\#1040](https://github.com/finos/perspective/pull/1040) ([texodus](https://github.com/texodus))
- Upgrade `papaparse` [\#1033](https://github.com/finos/perspective/pull/1033) ([zemeolotu](https://github.com/zemeolotu))
- Add abs sum as an aggregator [\#1031](https://github.com/finos/perspective/pull/1031) ([harsh-jindal](https://github.com/harsh-jindal))
- Add plugin save and restore api to `perspective-viewer-datagrid` [\#1029](https://github.com/finos/perspective/pull/1029) ([zemeolotu](https://github.com/zemeolotu))
- Fix minor bugs in Perspective datetime + NaN handling [\#1028](https://github.com/finos/perspective/pull/1028) ([sc1f](https://github.com/sc1f))
- Update to emsdk 1.39.12 and remove 2gb MAXIMUM\_MEMORY [\#1015](https://github.com/finos/perspective/pull/1015) ([texodus](https://github.com/texodus))

## [v0.4.8](https://github.com/finos/perspective/tree/v0.4.8) (2020-04-21)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.7...v0.4.8)

**Fixed bugs:**

- UI Bug: match grid and columns panel scrollbar styles [\#602](https://github.com/finos/perspective/issues/602)

**Closed issues:**

- How perspective interacts with data coming from a c program [\#1009](https://github.com/finos/perspective/issues/1009)
- Minor error in Perspective Viewer API documentation [\#1004](https://github.com/finos/perspective/issues/1004)

**Merged pull requests:**

- Datagrid virtual scroll fixes and `-webkit-scrollbar` CSS [\#1018](https://github.com/finos/perspective/pull/1018) ([texodus](https://github.com/texodus))
- Adds -Wall and fixes C++ build warnings [\#1017](https://github.com/finos/perspective/pull/1017) ([texodus](https://github.com/texodus))
- When updating tables typed as `int` with `float64` numpy arrays, copy instead of filling iteratively [\#1012](https://github.com/finos/perspective/pull/1012) ([sc1f](https://github.com/sc1f))
- Update Python benchmarks to include results for `update` calls [\#1011](https://github.com/finos/perspective/pull/1011) ([sc1f](https://github.com/sc1f))
- Add Manylinux Python 3.7 wheel build + tests, disable Azure Windows Python build [\#1010](https://github.com/finos/perspective/pull/1010) ([sc1f](https://github.com/sc1f))
- Bump minimist from 1.2.0 to 1.2.3 [\#1001](https://github.com/finos/perspective/pull/1001) ([dependabot[bot]](https://github.com/apps/dependabot))

## [v0.4.7](https://github.com/finos/perspective/tree/v0.4.7) (2020-04-06)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.6...v0.4.7)

**Implemented enhancements:**

- `@finos/perspective-viewer-datagrid` Tree Formatting [\#993](https://github.com/finos/perspective/pull/993) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Fix column resizing when column pivots are present, and update docs and examples. [\#1002](https://github.com/finos/perspective/pull/1002) ([texodus](https://github.com/texodus))
- Fix incorrect sort order when hidden, pivoted columns are sorted [\#1000](https://github.com/finos/perspective/pull/1000) ([sc1f](https://github.com/sc1f))
- `@finos/perspective-viewer-datagrid` Bug Fixes [\#997](https://github.com/finos/perspective/pull/997) ([texodus](https://github.com/texodus))
- perspective-workspace fixes [\#990](https://github.com/finos/perspective/pull/990) ([zemeolotu](https://github.com/zemeolotu))
- tweak accessor to accept numpy dict [\#985](https://github.com/finos/perspective/pull/985) ([timkpaine](https://github.com/timkpaine))
- remove cpp test check from setup.py \(no more cpp tests\) [\#982](https://github.com/finos/perspective/pull/982) ([timkpaine](https://github.com/timkpaine))

**Closed issues:**

- :documentation [\#1003](https://github.com/finos/perspective/issues/1003)
- Custom sorting order [\#996](https://github.com/finos/perspective/issues/996)
- Writing integration tests using jest framework [\#994](https://github.com/finos/perspective/issues/994)
- How to customizing behavior with perspective.config.js [\#989](https://github.com/finos/perspective/issues/989)
- Jupyterlab widget not working with jupyterlab 2.0.0 or 2.0.1 [\#981](https://github.com/finos/perspective/issues/981)

**Merged pull requests:**

- Add `lock` to PerspectiveManager [\#999](https://github.com/finos/perspective/pull/999) ([sc1f](https://github.com/sc1f))
- Look for PyArrow relative to Perspective in @rpath [\#995](https://github.com/finos/perspective/pull/995) ([sc1f](https://github.com/sc1f))
- Purge `@finos/perspective-viewer-hypergrid` [\#991](https://github.com/finos/perspective/pull/991) ([texodus](https://github.com/texodus))
- Documentation: update PerspectiveTornadoServer to PerspectiveTornadoHandler [\#987](https://github.com/finos/perspective/pull/987) ([ceball](https://github.com/ceball))

## [v0.4.6](https://github.com/finos/perspective/tree/v0.4.6) (2020-03-17)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.5...v0.4.6)

**Implemented enhancements:**

- Datagrid row selection and column resize [\#979](https://github.com/finos/perspective/pull/979) ([texodus](https://github.com/texodus))
- Remove duplicate brew instructions [\#973](https://github.com/finos/perspective/pull/973) ([JHawk](https://github.com/JHawk))
- Add `linked` filter mode to `perspective-workspace` [\#969](https://github.com/finos/perspective/pull/969) ([zemeolotu](https://github.com/zemeolotu))
- Datagrid header click-to-sort and assorted improvements [\#967](https://github.com/finos/perspective/pull/967) ([texodus](https://github.com/texodus))
- Add ==, !=, \>, \<, and string equality computed columns [\#957](https://github.com/finos/perspective/pull/957) ([sc1f](https://github.com/sc1f))
- New plugin `@finos/perspective-viewer-datagrid` [\#954](https://github.com/finos/perspective/pull/954) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- CI not triggering [\#976](https://github.com/finos/perspective/issues/976)
- Perspective issue while building [\#932](https://github.com/finos/perspective/issues/932)
- Update azure-pipelines.yml for Azure Pipelines [\#977](https://github.com/finos/perspective/pull/977) ([timkpaine](https://github.com/timkpaine))
- PerspectiveManager no longer treats `str` as `bytes` in Python 2 [\#965](https://github.com/finos/perspective/pull/965) ([sc1f](https://github.com/sc1f))
- Fully clear queued updates before adding a new computed column [\#961](https://github.com/finos/perspective/pull/961) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Is there any way to get event type in perspective [\#968](https://github.com/finos/perspective/issues/968)

**Merged pull requests:**

- Update typings to include nodejs only components  [\#980](https://github.com/finos/perspective/pull/980) ([zemeolotu](https://github.com/zemeolotu))
- update dependencies to jupyterlab 2.0, phosphor -\> lumino [\#970](https://github.com/finos/perspective/pull/970) ([timkpaine](https://github.com/timkpaine))
- Refactor out `WebsSocketManager` from `WebSockerServer` [\#963](https://github.com/finos/perspective/pull/963) ([zemeolotu](https://github.com/zemeolotu))

## [v0.4.5](https://github.com/finos/perspective/tree/v0.4.5) (2020-02-28)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.4...v0.4.5)

**Fixed bugs:**

- Prune bench from python manifest [\#952](https://github.com/finos/perspective/issues/952)
- Emit source maps for WebWorker. [\#956](https://github.com/finos/perspective/pull/956) ([texodus](https://github.com/texodus))
- Bugfix sdist [\#953](https://github.com/finos/perspective/pull/953) ([timkpaine](https://github.com/timkpaine))

**Merged pull requests:**

- Refactor `gnode` and `gnode\_state`, remove C++ test suite [\#939](https://github.com/finos/perspective/pull/939) ([sc1f](https://github.com/sc1f))

## [v0.4.4](https://github.com/finos/perspective/tree/v0.4.4) (2020-02-26)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.3...v0.4.4)

**Implemented enhancements:**

- Remove some stale code [\#927](https://github.com/finos/perspective/pull/927) ([timkpaine](https://github.com/timkpaine))
- Fix for \#921: unifies versioning between JS and Python libraries [\#923](https://github.com/finos/perspective/pull/923) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- Numpy int defaults to int32 on Windows, int64 on \*nix [\#926](https://github.com/finos/perspective/issues/926)
- Incorrect semver for front end assets causing issues with voila [\#921](https://github.com/finos/perspective/issues/921)
- Fixes off-by-one error in `end\_col` [\#948](https://github.com/finos/perspective/pull/948) ([texodus](https://github.com/texodus))
- Fix \#945: Improve Python install docs [\#947](https://github.com/finos/perspective/pull/947) ([sc1f](https://github.com/sc1f))
- Fix tables `delete` bug in `perspective-workspace` [\#946](https://github.com/finos/perspective/pull/946) ([zemeolotu](https://github.com/zemeolotu))
- Deal with np.int\_ on Windows, handle missing \_\_INDEX\_\_ [\#943](https://github.com/finos/perspective/pull/943) ([timkpaine](https://github.com/timkpaine))
- Fix widget title in `perspective-workspace` [\#934](https://github.com/finos/perspective/pull/934) ([zemeolotu](https://github.com/zemeolotu))
- Fix `perspective-workspace` non-unique generated slotid bug [\#925](https://github.com/finos/perspective/pull/925) ([zemeolotu](https://github.com/zemeolotu))
- Fix `perspective-workspace` initialize bug [\#924](https://github.com/finos/perspective/pull/924) ([zemeolotu](https://github.com/zemeolotu))

**Closed issues:**

- How to Set schema for perspective table [\#951](https://github.com/finos/perspective/issues/951)
- Update install documentation  [\#945](https://github.com/finos/perspective/issues/945)
- Smoothen python installation process \(on windows\) [\#944](https://github.com/finos/perspective/issues/944)
- Typo: PerspectiveViewer -\> PerspectiveManager [\#900](https://github.com/finos/perspective/issues/900)

**Merged pull requests:**

- Activate Perspective in FINOS Foundation [\#949](https://github.com/finos/perspective/pull/949) ([mcleo-d](https://github.com/mcleo-d))
- Package/dist license in python package [\#930](https://github.com/finos/perspective/pull/930) ([timkpaine](https://github.com/timkpaine))
- Adds test coverage reporting for`@finos/perspective` [\#920](https://github.com/finos/perspective/pull/920) ([texodus](https://github.com/texodus))

## [v0.4.3](https://github.com/finos/perspective/tree/v0.4.3) (2020-02-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.2...v0.4.3)

**Implemented enhancements:**

- adding sdist check so we don't deploy broken sdists accidentally [\#918](https://github.com/finos/perspective/pull/918) ([timkpaine](https://github.com/timkpaine))

**Fixed bugs:**

- Bug: Missing class exports on windows [\#883](https://github.com/finos/perspective/issues/883)
- Event regression fix [\#922](https://github.com/finos/perspective/pull/922) ([texodus](https://github.com/texodus))
- Remove `@finos/perspective-phosphor` and fix \#825 regression. [\#919](https://github.com/finos/perspective/pull/919) ([texodus](https://github.com/texodus))

**Merged pull requests:**

- Added Azure compatible reporting for tests [\#916](https://github.com/finos/perspective/pull/916) ([texodus](https://github.com/texodus))
- Set up CI with Azure Pipelines [\#915](https://github.com/finos/perspective/pull/915) ([timkpaine](https://github.com/timkpaine))
- Fix bug where `perspective-viewer` doesn't resize [\#911](https://github.com/finos/perspective/pull/911) ([zemeolotu](https://github.com/zemeolotu))

## [v0.4.2](https://github.com/finos/perspective/tree/v0.4.2) (2020-02-10)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.1...v0.4.2)

**Implemented enhancements:**

- `perspective-viewer-hypergrid` Tree column toggle buttons. [\#914](https://github.com/finos/perspective/pull/914) ([texodus](https://github.com/texodus))
- Remove `perspective.node` Python module. [\#912](https://github.com/finos/perspective/pull/912) ([texodus](https://github.com/texodus))
- Make `perspective-viewer-hypergrid` selection state save/restore compatible [\#903](https://github.com/finos/perspective/pull/903) ([zemeolotu](https://github.com/zemeolotu))
- Add 'workspace-layout-update' event and css class selector names cleanup  [\#902](https://github.com/finos/perspective/pull/902) ([zemeolotu](https://github.com/zemeolotu))
- Custom Element API for `\<perspective-workspace\>` [\#901](https://github.com/finos/perspective/pull/901) ([texodus](https://github.com/texodus))
- implement save/restore on viewer configuration [\#896](https://github.com/finos/perspective/pull/896) ([timkpaine](https://github.com/timkpaine))
- Add 'perspective-select' event to `@finos/perspective-viewer-hypergrid` [\#894](https://github.com/finos/perspective/pull/894) ([zemeolotu](https://github.com/zemeolotu))
- Make `@finos/perspective-workspace` widget title editable by doubleclick [\#891](https://github.com/finos/perspective/pull/891) ([zemeolotu](https://github.com/zemeolotu))
- Style fixes for `perspective-workspace` [\#890](https://github.com/finos/perspective/pull/890) ([texodus](https://github.com/texodus))
- Fix selection styling on `@finos/perspective-viewer-hypergrid` [\#889](https://github.com/finos/perspective/pull/889) ([zemeolotu](https://github.com/zemeolotu))
- Fixed React types. [\#886](https://github.com/finos/perspective/pull/886) ([texodus](https://github.com/texodus))
- updates and fixes for windows build [\#884](https://github.com/finos/perspective/pull/884) ([timkpaine](https://github.com/timkpaine))
- Allow missing columns [\#881](https://github.com/finos/perspective/pull/881) ([texodus](https://github.com/texodus))
- Add new package `@finos/perspective-workspace` [\#874](https://github.com/finos/perspective/pull/874) ([zemeolotu](https://github.com/zemeolotu))

**Fixed bugs:**

- Pivoted PerspectiveWidget column order broken in Python 2 [\#904](https://github.com/finos/perspective/issues/904)
- "mean by count" aggregation throws a "Not implemented" error [\#887](https://github.com/finos/perspective/issues/887)
- CSS theme issues [\#882](https://github.com/finos/perspective/issues/882)
- clear\(\) error for perspective-viewer [\#878](https://github.com/finos/perspective/issues/878)
- Fix column ordering in Python, null handling for computed columns [\#907](https://github.com/finos/perspective/pull/907) ([sc1f](https://github.com/sc1f))
- Fix \#898 - week bucket overflows [\#899](https://github.com/finos/perspective/pull/899) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Computed Columns date bucket functions can overflow year. [\#898](https://github.com/finos/perspective/issues/898)
- React and TypeScript TS2740 [\#865](https://github.com/finos/perspective/issues/865)

**Merged pull requests:**

- Remove yarn dependency duplication. [\#908](https://github.com/finos/perspective/pull/908) ([texodus](https://github.com/texodus))
- Bump core-js to v3.6.4 and Babel to 7.8.4 [\#906](https://github.com/finos/perspective/pull/906) ([sebinsua](https://github.com/sebinsua))
- `\<perspective-viewer\>` UI cleanup [\#905](https://github.com/finos/perspective/pull/905) ([texodus](https://github.com/texodus))
- Better test screenshot archiving. [\#895](https://github.com/finos/perspective/pull/895) ([texodus](https://github.com/texodus))
- Update Python README [\#893](https://github.com/finos/perspective/pull/893) ([sc1f](https://github.com/sc1f))
- Implement computed column functions in C++ [\#892](https://github.com/finos/perspective/pull/892) ([sc1f](https://github.com/sc1f))
- Improve Perspective Documentation [\#873](https://github.com/finos/perspective/pull/873) ([sc1f](https://github.com/sc1f))

## [v0.4.1](https://github.com/finos/perspective/tree/v0.4.1) (2020-01-27)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0...v0.4.1)

**Implemented enhancements:**

- New computed functions `pow`, `invert`, `sqrt`, `abs` [\#871](https://github.com/finos/perspective/pull/871) ([texodus](https://github.com/texodus))
- Optional `@finos/perspective-webpack-plugin` [\#870](https://github.com/finos/perspective/pull/870) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Datetime conversion in Python can overflow non-deterministically [\#754](https://github.com/finos/perspective/issues/754)
- Scrolling in `@finos/perspective-viewer-hypergrid` is broken when \(n\>1\) sorts and \(n\>0\) row pivots are applied [\#737](https://github.com/finos/perspective/issues/737)
- Fix `on\_update` callbacks in Python [\#880](https://github.com/finos/perspective/pull/880) ([sc1f](https://github.com/sc1f))
- Improve `@finos/perspective-viewer` typings [\#872](https://github.com/finos/perspective/pull/872) ([zemeolotu](https://github.com/zemeolotu))
- Allow plugins to be importable before '`perspective-viewer` [\#868](https://github.com/finos/perspective/pull/868) ([zemeolotu](https://github.com/zemeolotu))
- Time zone awareness in perspective-python [\#867](https://github.com/finos/perspective/pull/867) ([sc1f](https://github.com/sc1f))
- Fix scrolling for pivoted hypergrid [\#866](https://github.com/finos/perspective/pull/866) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- BUG: Sum Aggregation calculated incorrectly [\#864](https://github.com/finos/perspective/issues/864)
- Source maps for webpack-plugin [\#861](https://github.com/finos/perspective/issues/861)
- Using Perspective with Angular [\#860](https://github.com/finos/perspective/issues/860)

**Merged pull requests:**

- Extend `perspective-viewer` typings and added a react-typescript example [\#877](https://github.com/finos/perspective/pull/877) ([zemeolotu](https://github.com/zemeolotu))
- Hiring! [\#876](https://github.com/finos/perspective/pull/876) ([texodus](https://github.com/texodus))
- Added simple webpack example and renamed existing webpack example [\#869](https://github.com/finos/perspective/pull/869) ([zemeolotu](https://github.com/zemeolotu))
- Python versioning fix [\#863](https://github.com/finos/perspective/pull/863) ([sc1f](https://github.com/sc1f))

## [v0.4.0](https://github.com/finos/perspective/tree/v0.4.0) (2020-01-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0-rc.6...v0.4.0)

**Implemented enhancements:**

- Exp bin functions [\#851](https://github.com/finos/perspective/pull/851) ([texodus](https://github.com/texodus))
- Implement `to\_arrow` in C++ for JS/Python [\#850](https://github.com/finos/perspective/pull/850) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- Fix `perspective-viewer` to allow loading a table before it's attache… [\#854](https://github.com/finos/perspective/pull/854) ([zemeolotu](https://github.com/zemeolotu))
- Fix `perspective-jupyterlab` theme [\#853](https://github.com/finos/perspective/pull/853) ([zemeolotu](https://github.com/zemeolotu))

**Closed issues:**

- python-perspective from pypi [\#856](https://github.com/finos/perspective/issues/856)

**Merged pull requests:**

- Improved error messages from C++ [\#862](https://github.com/finos/perspective/pull/862) ([sc1f](https://github.com/sc1f))
- Add benchmark suite for Python, Refactor module loading for environments where C++ cannot be built [\#859](https://github.com/finos/perspective/pull/859) ([sc1f](https://github.com/sc1f))
- Workspace fixes [\#858](https://github.com/finos/perspective/pull/858) ([texodus](https://github.com/texodus))
- add pypi badge [\#855](https://github.com/finos/perspective/pull/855) ([timkpaine](https://github.com/timkpaine))
- Update versioning script for Python [\#852](https://github.com/finos/perspective/pull/852) ([sc1f](https://github.com/sc1f))

## [v0.4.0-rc.6](https://github.com/finos/perspective/tree/v0.4.0-rc.6) (2019-12-18)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0-rc.5...v0.4.0-rc.6)

## [v0.4.0-rc.5](https://github.com/finos/perspective/tree/v0.4.0-rc.5) (2019-12-18)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0-rc.4...v0.4.0-rc.5)

**Implemented enhancements:**

- Jupyter: Export static image so pdf conversion works [\#617](https://github.com/finos/perspective/issues/617)
- `weighted mean` aggregate type [\#846](https://github.com/finos/perspective/pull/846) ([texodus](https://github.com/texodus))
- Theme `material-dense` [\#845](https://github.com/finos/perspective/pull/845) ([texodus](https://github.com/texodus))
- Add `selectable` attribute to `perspective-viewer` [\#842](https://github.com/finos/perspective/pull/842) ([zemeolotu](https://github.com/zemeolotu))
- CSV/JSON renderer in JupyterLab [\#832](https://github.com/finos/perspective/pull/832) ([timkpaine](https://github.com/timkpaine))
- Read date32, date64, decimal128 from Arrow datasets [\#829](https://github.com/finos/perspective/pull/829) ([sc1f](https://github.com/sc1f))
- Add `delete\(\)` to widget, cache client updates before render, refactor module structure [\#823](https://github.com/finos/perspective/pull/823) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- Hypergrid doesnt resize when PerspectiveWidget is resized [\#825](https://github.com/finos/perspective/issues/825)
- Readd pip install and sdist test [\#816](https://github.com/finos/perspective/issues/816)
- Make master doesn't work when theres a tab behind [\#814](https://github.com/finos/perspective/issues/814)
- Viewer type definition missing methods [\#568](https://github.com/finos/perspective/issues/568)
- Fixed resize behavior [\#848](https://github.com/finos/perspective/pull/848) ([texodus](https://github.com/texodus))
- Node.js `table` unpin [\#844](https://github.com/finos/perspective/pull/844) ([texodus](https://github.com/texodus))
- Asynchronously process updates when running in Tornado [\#838](https://github.com/finos/perspective/pull/838) ([sc1f](https://github.com/sc1f))
- Throttle fix [\#835](https://github.com/finos/perspective/pull/835) ([texodus](https://github.com/texodus))
- Preserve user columns and pivots in widget [\#833](https://github.com/finos/perspective/pull/833) ([sc1f](https://github.com/sc1f))
- Fix `PerspectiveWorkspace` when tabbed views are moved to master [\#831](https://github.com/finos/perspective/pull/831) ([zemeolotu](https://github.com/zemeolotu))
- Widget fixes for resizing, TS typings, boolean columns [\#826](https://github.com/finos/perspective/pull/826) ([sc1f](https://github.com/sc1f))
- Properly remove `on\_delete` and `on\_update` callbacks that fail. [\#822](https://github.com/finos/perspective/pull/822) ([sc1f](https://github.com/sc1f))
- Default to int64 in Python3, add `long` and `unicode` to schema and type inference [\#821](https://github.com/finos/perspective/pull/821) ([sc1f](https://github.com/sc1f))
- Fix misordered columns in update [\#818](https://github.com/finos/perspective/pull/818) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- How to delete a hosted table? [\#841](https://github.com/finos/perspective/issues/841)
- Reference: Python build error from cmake FindPythonLibs [\#830](https://github.com/finos/perspective/issues/830)
- Request to Feature perspective on Docusaurus users page [\#613](https://github.com/finos/perspective/issues/613)

**Merged pull requests:**

- Refactor `perspective-viewer` themes to include css classes [\#849](https://github.com/finos/perspective/pull/849) ([zemeolotu](https://github.com/zemeolotu))
- add editable example to readme [\#847](https://github.com/finos/perspective/pull/847) ([timkpaine](https://github.com/timkpaine))
- Async resize [\#840](https://github.com/finos/perspective/pull/840) ([texodus](https://github.com/texodus))
- Python build overhaul [\#839](https://github.com/finos/perspective/pull/839) ([timkpaine](https://github.com/timkpaine))
- Improvements to Arrow updates and indexed columns [\#837](https://github.com/finos/perspective/pull/837) ([sc1f](https://github.com/sc1f))
- Remove `ci\_python` and refactor scripts. [\#836](https://github.com/finos/perspective/pull/836) ([texodus](https://github.com/texodus))
- Set Enums as values for Widget/Viewer, refactor test folder structure [\#834](https://github.com/finos/perspective/pull/834) ([sc1f](https://github.com/sc1f))
- Stricter linting for comments [\#828](https://github.com/finos/perspective/pull/828) ([texodus](https://github.com/texodus))
- Add PerspectiveWorkspace olympics example to README [\#820](https://github.com/finos/perspective/pull/820) ([zemeolotu](https://github.com/zemeolotu))
- Update Perspective website with Python API and user guide [\#819](https://github.com/finos/perspective/pull/819) ([sc1f](https://github.com/sc1f))

## [v0.4.0-rc.4](https://github.com/finos/perspective/tree/v0.4.0-rc.4) (2019-11-14)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0-rc.3...v0.4.0-rc.4)

**Implemented enhancements:**

- Client mode supports dataframes, np.ndarray, structured and recarray [\#813](https://github.com/finos/perspective/pull/813) ([sc1f](https://github.com/sc1f))
- Allow client mode widget to be constructed with schema [\#807](https://github.com/finos/perspective/pull/807) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- Widget does not automatically re-render when calling load\(\) after initializing with `None` [\#810](https://github.com/finos/perspective/issues/810)
- Phosphor workspace doesn't resize when embedded in other phosphor widgets [\#808](https://github.com/finos/perspective/issues/808)
- Sort order is lost when both \(n\>1\) row and \(n\>0\) column pivots are applied and a row group is collapsed [\#736](https://github.com/finos/perspective/issues/736)
- Broken links in docs [\#701](https://github.com/finos/perspective/issues/701)
- Fixed 2-sided sorting on column-only pivots [\#815](https://github.com/finos/perspective/pull/815) ([texodus](https://github.com/texodus))
- Python build fixes [\#809](https://github.com/finos/perspective/pull/809) ([texodus](https://github.com/texodus))
- Fixed Python Arrow loading bug [\#806](https://github.com/finos/perspective/pull/806) ([texodus](https://github.com/texodus))
- Two sided sort fixes [\#805](https://github.com/finos/perspective/pull/805) ([texodus](https://github.com/texodus))

**Closed issues:**

- Sort order is lost when both \(n\>1\) row and \(n\>0\) column pivots are applied and `replace\(\)` is called [\#804](https://github.com/finos/perspective/issues/804)

**Merged pull requests:**

- Add puppeteer tests for `perspective-phosphor` [\#812](https://github.com/finos/perspective/pull/812) ([zemeolotu](https://github.com/zemeolotu))
- Hypergrid no longer depends on `Object.keys` order of dataset [\#811](https://github.com/finos/perspective/pull/811) ([sc1f](https://github.com/sc1f))
- Tweak date/datetime inference, remove dependency on non-core Numpy/Pandas API [\#802](https://github.com/finos/perspective/pull/802) ([sc1f](https://github.com/sc1f))
- add websocket export in type definition [\#800](https://github.com/finos/perspective/pull/800) ([timkpaine](https://github.com/timkpaine))
- allow for right master [\#799](https://github.com/finos/perspective/pull/799) ([timkpaine](https://github.com/timkpaine))
- Add umd build and updated tests for `perspective-phosphor` [\#798](https://github.com/finos/perspective/pull/798) ([zemeolotu](https://github.com/zemeolotu))

## [v0.4.0-rc.3](https://github.com/finos/perspective/tree/v0.4.0-rc.3) (2019-11-06)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0-rc.2...v0.4.0-rc.3)

**Implemented enhancements:**

- Dataframe/Numpy Array Loader [\#791](https://github.com/finos/perspective/pull/791) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Is there something like d3\_xy\_line and something that i can draw multiple line in one chart with d3fc? [\#789](https://github.com/finos/perspective/issues/789)

**Merged pull requests:**

- Fixed travis build error & hypergrid console error [\#795](https://github.com/finos/perspective/pull/795) ([texodus](https://github.com/texodus))
- Added `promo` example project [\#794](https://github.com/finos/perspective/pull/794) ([texodus](https://github.com/texodus))
- Add `update` for widget in client mode, fix `on\_update` in Python 2 [\#793](https://github.com/finos/perspective/pull/793) ([sc1f](https://github.com/sc1f))
- Fixed aggregates to apply to hidden sorted columns [\#792](https://github.com/finos/perspective/pull/792) ([texodus](https://github.com/texodus))
- New logo & demo gif [\#790](https://github.com/finos/perspective/pull/790) ([texodus](https://github.com/texodus))
- Fixed `client` flag to default to True on Windows [\#788](https://github.com/finos/perspective/pull/788) ([texodus](https://github.com/texodus))

## [v0.4.0-rc.2](https://github.com/finos/perspective/tree/v0.4.0-rc.2) (2019-10-31)

[Full Changelog](https://github.com/finos/perspective/compare/v0.4.0-rc.1...v0.4.0-rc.2)

**Fixed bugs:**

- Python 2/GCC \<5 compatibility [\#784](https://github.com/finos/perspective/pull/784) ([sc1f](https://github.com/sc1f))

**Merged pull requests:**

- Hypergrid paintloop removal [\#785](https://github.com/finos/perspective/pull/785) ([texodus](https://github.com/texodus))

## [v0.4.0-rc.1](https://github.com/finos/perspective/tree/v0.4.0-rc.1) (2019-10-24)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.9...v0.4.0-rc.1)

**Implemented enhancements:**

- Make imports relative [\#761](https://github.com/finos/perspective/issues/761)
- Expose toggleConfig in widget [\#714](https://github.com/finos/perspective/issues/714)
- Generate/copy JS assets for vanilla notebook [\#713](https://github.com/finos/perspective/issues/713)
- Add websocket support to Perspective webserver [\#712](https://github.com/finos/perspective/issues/712)
- Add non-ipywidgets bridge between perspective-python and perspective-viewer, in advanced of full C++ backend [\#624](https://github.com/finos/perspective/issues/624)
- Manage python version using the same code/tools as JS versions.  [\#597](https://github.com/finos/perspective/issues/597)
- `PerspectiveDockPanel` and `PerspectiveWorkspace` components [\#782](https://github.com/finos/perspective/pull/782) ([texodus](https://github.com/texodus))
- Added `Table\(\)` support for numpy recarray [\#771](https://github.com/finos/perspective/pull/771) ([texodus](https://github.com/texodus))
- Computed UX [\#765](https://github.com/finos/perspective/pull/765) ([texodus](https://github.com/texodus))
- Add `to\_csv` to Python API [\#759](https://github.com/finos/perspective/pull/759) ([sc1f](https://github.com/sc1f))
- Apache Arrow native reads for JS+Python [\#755](https://github.com/finos/perspective/pull/755) ([texodus](https://github.com/texodus))
- ＶΛＰＯＲＷΛＶΞ [\#739](https://github.com/finos/perspective/pull/739) ([texodus](https://github.com/texodus))
- Readable dates [\#695](https://github.com/finos/perspective/pull/695) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Missing \_\_init\_\_.py [\#762](https://github.com/finos/perspective/issues/762)
- Jupyterlab-phosphor should not attempt to load empty array [\#742](https://github.com/finos/perspective/issues/742)
- Fix multipackage install for python [\#636](https://github.com/finos/perspective/issues/636)
- Re-rendering a JupyterLab widget with arrow backing doesn't work, Bytes not being resent [\#626](https://github.com/finos/perspective/issues/626)
- Mobile fixes [\#781](https://github.com/finos/perspective/pull/781) ([texodus](https://github.com/texodus))
- Arrow fixes [\#772](https://github.com/finos/perspective/pull/772) ([texodus](https://github.com/texodus))
- Fixed ios compatibility [\#770](https://github.com/finos/perspective/pull/770) ([texodus](https://github.com/texodus))
- Hypergrid renderer fixes [\#764](https://github.com/finos/perspective/pull/764) ([texodus](https://github.com/texodus))
- Fixed `yarn clean` script [\#753](https://github.com/finos/perspective/pull/753) ([texodus](https://github.com/texodus))
- Fixed grid performance when pivoted [\#752](https://github.com/finos/perspective/pull/752) ([texodus](https://github.com/texodus))
- Fix update bugs [\#749](https://github.com/finos/perspective/pull/749) ([sc1f](https://github.com/sc1f))
- Fix empty list in phosphor plugin [\#745](https://github.com/finos/perspective/pull/745) ([timkpaine](https://github.com/timkpaine))
- Read numpy nans/datetimes [\#741](https://github.com/finos/perspective/pull/741) ([sc1f](https://github.com/sc1f))

**Closed issues:**

- Wrong type for table.is\_valid\_filter in docs? [\#775](https://github.com/finos/perspective/issues/775)
- Are arrow codepaths still relevant [\#760](https://github.com/finos/perspective/issues/760)
- Create config json schema for the viewer and plugins for documentation and config json validation [\#746](https://github.com/finos/perspective/issues/746)
- Computed columns do not update when grouped [\#738](https://github.com/finos/perspective/issues/738)

**Merged pull requests:**

- Link `lerna version` to `bumpversion` [\#780](https://github.com/finos/perspective/pull/780) ([sc1f](https://github.com/sc1f))
- Fixes jupyterlab plugin regressions [\#779](https://github.com/finos/perspective/pull/779) ([texodus](https://github.com/texodus))
- Adjust setup.py for MacOS wheel dist [\#778](https://github.com/finos/perspective/pull/778) ([sc1f](https://github.com/sc1f))
- Add exception handling, clean up PSP\_COMPLAIN\_AND\_ABORT [\#777](https://github.com/finos/perspective/pull/777) ([sc1f](https://github.com/sc1f))
- Multiple views on JLab plugin [\#776](https://github.com/finos/perspective/pull/776) ([sc1f](https://github.com/sc1f))
- Update declaration [\#773](https://github.com/finos/perspective/pull/773) ([ghost](https://github.com/ghost))
- Upgrade Arrow to 0.15.0, link python arrow from prebuilt library [\#768](https://github.com/finos/perspective/pull/768) ([sc1f](https://github.com/sc1f))
- Add tornado handler for perspective-python [\#766](https://github.com/finos/perspective/pull/766) ([sc1f](https://github.com/sc1f))
- Python sdist  [\#763](https://github.com/finos/perspective/pull/763) ([timkpaine](https://github.com/timkpaine))
- Add core-js@2 dependency that is required by transpiled outputs of Babel [\#758](https://github.com/finos/perspective/pull/758) ([texodus](https://github.com/texodus))
- Rewrite Perspective Jupyterlab and Phosphor API [\#756](https://github.com/finos/perspective/pull/756) ([sc1f](https://github.com/sc1f))
- ES6 Client API [\#751](https://github.com/finos/perspective/pull/751) ([sc1f](https://github.com/sc1f))
- add compute\(\) to dynamically show/hide sidebar computation panel [\#748](https://github.com/finos/perspective/pull/748) ([sc1f](https://github.com/sc1f))
- Allow users register multiple on\_delete callbacks to view and table [\#747](https://github.com/finos/perspective/pull/747) ([zemeolotu](https://github.com/zemeolotu))
- Some cleanup items [\#744](https://github.com/finos/perspective/pull/744) ([timkpaine](https://github.com/timkpaine))
- Add PerspectiveManager remote API for Python, Tornado server example [\#743](https://github.com/finos/perspective/pull/743) ([sc1f](https://github.com/sc1f))
- Computed column partial update [\#740](https://github.com/finos/perspective/pull/740) ([texodus](https://github.com/texodus))
- Test suite failure feedback [\#735](https://github.com/finos/perspective/pull/735) ([texodus](https://github.com/texodus))
- Added .gitattributes [\#734](https://github.com/finos/perspective/pull/734) ([texodus](https://github.com/texodus))
- Enable update with \_\_INDEX\_\_ on explicit index column [\#733](https://github.com/finos/perspective/pull/733) ([sc1f](https://github.com/sc1f))
- Remove incorrect does not equal filter [\#732](https://github.com/finos/perspective/pull/732) ([willium](https://github.com/willium))
- fixes view-\>plugin rename that didnt make it from original repo [\#731](https://github.com/finos/perspective/pull/731) ([timkpaine](https://github.com/timkpaine))
- Python improvements + refactor [\#730](https://github.com/finos/perspective/pull/730) ([sc1f](https://github.com/sc1f))
- Allow partial updates on computed column source columns [\#729](https://github.com/finos/perspective/pull/729) ([sc1f](https://github.com/sc1f))
- convert to monolithic python install [\#728](https://github.com/finos/perspective/pull/728) ([timkpaine](https://github.com/timkpaine))
- Python [\#723](https://github.com/finos/perspective/pull/723) ([timkpaine](https://github.com/timkpaine))

## [v0.3.9](https://github.com/finos/perspective/tree/v0.3.9) (2019-09-16)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.8...v0.3.9)

**Implemented enhancements:**

- Pull python docs from python folders into docusaurus [\#724](https://github.com/finos/perspective/issues/724)
- Implement column extraction as numpy array or arrow column [\#721](https://github.com/finos/perspective/issues/721)
- Implement to/from numpy code in C++ [\#716](https://github.com/finos/perspective/issues/716)
- Port Perspective js examples to Observable js notebooks for dataViz devs to experiment with [\#560](https://github.com/finos/perspective/issues/560)
- Editing for `@finos/perspective-viewer-hypergrid` [\#708](https://github.com/finos/perspective/pull/708) ([texodus](https://github.com/texodus))
- Added `index` API to `to\_format` methods [\#693](https://github.com/finos/perspective/pull/693) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Make sure datetime localization is consistent between psp internals and python to/from string [\#722](https://github.com/finos/perspective/issues/722)
- Make sure cpp folder ends up in perspective-python.table's manifest so that build happen. [\#720](https://github.com/finos/perspective/issues/720)
- Do we still compile to asm.js? Docs update [\#719](https://github.com/finos/perspective/issues/719)
- Hook perspective into ipywidgets [\#694](https://github.com/finos/perspective/issues/694)
- Copy-paste error in last PR [\#710](https://github.com/finos/perspective/pull/710) ([timkpaine](https://github.com/timkpaine))

**Closed issues:**

- IE11 support [\#709](https://github.com/finos/perspective/issues/709)
- Document arrow data types to perspective data schema load init mapping [\#601](https://github.com/finos/perspective/issues/601)
- Port to pybind11 from boost::python?  [\#598](https://github.com/finos/perspective/issues/598)

**Merged pull requests:**

- Fixed schema miscalculation with computed columns and implicit index [\#727](https://github.com/finos/perspective/pull/727) ([texodus](https://github.com/texodus))
- Misc cleanup and fixes [\#726](https://github.com/finos/perspective/pull/726) ([texodus](https://github.com/texodus))
- `yarn setup` [\#725](https://github.com/finos/perspective/pull/725) ([texodus](https://github.com/texodus))
- Remove regeneratorRuntime entirely [\#718](https://github.com/finos/perspective/pull/718) ([texodus](https://github.com/texodus))
- Bump lodash.merge from 4.6.1 to 4.6.2 [\#717](https://github.com/finos/perspective/pull/717) ([dependabot[bot]](https://github.com/apps/dependabot))
- Type-on-edit [\#715](https://github.com/finos/perspective/pull/715) ([texodus](https://github.com/texodus))
- `perspective-test` Module [\#711](https://github.com/finos/perspective/pull/711) ([texodus](https://github.com/texodus))
- Refactor C++ [\#707](https://github.com/finos/perspective/pull/707) ([sc1f](https://github.com/sc1f))
- Test implicit index & remove extraneous example file [\#706](https://github.com/finos/perspective/pull/706) ([sc1f](https://github.com/sc1f))
- documentation/style fix [\#705](https://github.com/finos/perspective/pull/705) ([timkpaine](https://github.com/timkpaine))
- `perspective-viewer` cleanup [\#703](https://github.com/finos/perspective/pull/703) ([texodus](https://github.com/texodus))
- Allow for perspective in ipywidgets layouts [\#702](https://github.com/finos/perspective/pull/702) ([timkpaine](https://github.com/timkpaine))
- Limit charts [\#700](https://github.com/finos/perspective/pull/700) ([texodus](https://github.com/texodus))
- `leaves\_only` flag for perspective [\#699](https://github.com/finos/perspective/pull/699) ([texodus](https://github.com/texodus))
- `index` column support [\#698](https://github.com/finos/perspective/pull/698) ([texodus](https://github.com/texodus))
- Bump mixin-deep from 1.3.1 to 1.3.2 [\#697](https://github.com/finos/perspective/pull/697) ([dependabot[bot]](https://github.com/apps/dependabot))
- Fixed README.md [\#696](https://github.com/finos/perspective/pull/696) ([texodus](https://github.com/texodus))
- Calculate row offset in C++, refactor Table, remove implicit primary key mode [\#692](https://github.com/finos/perspective/pull/692) ([sc1f](https://github.com/sc1f))
- Fixed chunked arrow test to actually be chunked [\#691](https://github.com/finos/perspective/pull/691) ([texodus](https://github.com/texodus))

## [v0.3.8](https://github.com/finos/perspective/tree/v0.3.8) (2019-08-26)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.7...v0.3.8)

**Merged pull requests:**

- Emsdk upstream [\#690](https://github.com/finos/perspective/pull/690) ([texodus](https://github.com/texodus))
- 0-sided Performance Fix [\#689](https://github.com/finos/perspective/pull/689) ([texodus](https://github.com/texodus))

## [v0.3.7](https://github.com/finos/perspective/tree/v0.3.7) (2019-08-20)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.6...v0.3.7)

**Implemented enhancements:**

- Add support for rollup bundler [\#605](https://github.com/finos/perspective/issues/605)

**Fixed bugs:**

- No dist [\#681](https://github.com/finos/perspective/issues/681)
- Types doesnt match, no test to check [\#674](https://github.com/finos/perspective/issues/674)
- Autocomplete error when filtering string column with empty/null values [\#668](https://github.com/finos/perspective/issues/668)
- Version pulled from package.json too early, ends up 1 version behind dist [\#616](https://github.com/finos/perspective/issues/616)
- Click events on the tree column of a grid do not work if column pivots have been applied [\#505](https://github.com/finos/perspective/issues/505)
- JupyterLab plugin dist is broken - build/dist conversion [\#467](https://github.com/finos/perspective/issues/467)

**Closed issues:**

- Source Documentation Improvements [\#384](https://github.com/finos/perspective/issues/384)

**Merged pull requests:**

- Added column-width to style API [\#688](https://github.com/finos/perspective/pull/688) ([texodus](https://github.com/texodus))
- Added 'dataset' configurable data example [\#687](https://github.com/finos/perspective/pull/687) ([texodus](https://github.com/texodus))
- `perspective-click` fix [\#686](https://github.com/finos/perspective/pull/686) ([texodus](https://github.com/texodus))
- Fix performance regression [\#685](https://github.com/finos/perspective/pull/685) ([texodus](https://github.com/texodus))
- Fix scatter row\_pivots\_values exception on click [\#684](https://github.com/finos/perspective/pull/684) ([JHawk](https://github.com/JHawk))
- Pinned D3FC to 14.0.40 [\#683](https://github.com/finos/perspective/pull/683) ([texodus](https://github.com/texodus))
- Style API [\#682](https://github.com/finos/perspective/pull/682) ([texodus](https://github.com/texodus))
- Remove nan filtering, add null filtering [\#676](https://github.com/finos/perspective/pull/676) ([jspillers](https://github.com/jspillers))
- Fix \#616: perspective-jupyterlab versioning [\#675](https://github.com/finos/perspective/pull/675) ([sc1f](https://github.com/sc1f))
- Fix jlab again [\#673](https://github.com/finos/perspective/pull/673) ([timkpaine](https://github.com/timkpaine))
- Add view config class in C++ [\#672](https://github.com/finos/perspective/pull/672) ([sc1f](https://github.com/sc1f))
- Fix exception for filter labels [\#669](https://github.com/finos/perspective/pull/669) ([jspillers](https://github.com/jspillers))
- Update phosphor component to use `plugin` instead of view [\#667](https://github.com/finos/perspective/pull/667) ([zemeolotu](https://github.com/zemeolotu))
- Fixes user defined aggregates for computed columns [\#666](https://github.com/finos/perspective/pull/666) ([zemeolotu](https://github.com/zemeolotu))
- Allow arrow tables to be created from a schema [\#663](https://github.com/finos/perspective/pull/663) ([texodus](https://github.com/texodus))
- Updated example gists to use latest API [\#661](https://github.com/finos/perspective/pull/661) ([texodus](https://github.com/texodus))
- Cleaner API through the Table abstraction, prepare for Python API [\#642](https://github.com/finos/perspective/pull/642) ([sc1f](https://github.com/sc1f))

## [v0.3.6](https://github.com/finos/perspective/tree/v0.3.6) (2019-07-15)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.5...v0.3.6)

**Merged pull requests:**

- Fixed webpack plugin resolution of require\(\) [\#660](https://github.com/finos/perspective/pull/660) ([texodus](https://github.com/texodus))

## [v0.3.5](https://github.com/finos/perspective/tree/v0.3.5) (2019-07-15)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.4...v0.3.5)

**Closed issues:**

- MissingDependencyError: perspecitveJS packaging & bundling issues ... [\#658](https://github.com/finos/perspective/issues/658)
- Website: shows blank perspecitve viewers in FF v68 \(64-bit\) Quantum [\#656](https://github.com/finos/perspective/issues/656)

**Merged pull requests:**

- Npm gh fix [\#659](https://github.com/finos/perspective/pull/659) ([texodus](https://github.com/texodus))

## [v0.3.4](https://github.com/finos/perspective/tree/v0.3.4) (2019-07-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.3...v0.3.4)

## [v0.3.3](https://github.com/finos/perspective/tree/v0.3.3) (2019-07-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.2...v0.3.3)

## [v0.3.2](https://github.com/finos/perspective/tree/v0.3.2) (2019-07-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.1...v0.3.2)

**Implemented enhancements:**

- Underlying aggregate row in hypergrid [\#555](https://github.com/finos/perspective/issues/555)

**Fixed bugs:**

- Demos broken on safari [\#612](https://github.com/finos/perspective/issues/612)

**Closed issues:**

- Heatmap Customizing Thresholds [\#647](https://github.com/finos/perspective/issues/647)
- Webpack example not working [\#638](https://github.com/finos/perspective/issues/638)
- View appears twice in docs [\#569](https://github.com/finos/perspective/issues/569)

**Merged pull requests:**

- Fixed github reported vulnerability in lodash.template [\#654](https://github.com/finos/perspective/pull/654) ([texodus](https://github.com/texodus))
- Panel resize fixes [\#652](https://github.com/finos/perspective/pull/652) ([texodus](https://github.com/texodus))
- Fixed null pivotting issue [\#651](https://github.com/finos/perspective/pull/651) ([texodus](https://github.com/texodus))
- Made side-panel resizable [\#650](https://github.com/finos/perspective/pull/650) ([texodus](https://github.com/texodus))
- Remove column pivot \_\_ROW\_PATH\_\_ filter [\#649](https://github.com/finos/perspective/pull/649) ([JHawk](https://github.com/JHawk))
- Perspective config [\#644](https://github.com/finos/perspective/pull/644) ([texodus](https://github.com/texodus))
- Add hover styles to copy, download, reset [\#643](https://github.com/finos/perspective/pull/643) ([sc1f](https://github.com/sc1f))
- Moved loader dependencies out of webpack plugin [\#641](https://github.com/finos/perspective/pull/641) ([texodus](https://github.com/texodus))
- Fixed webpack config error in webpack example [\#640](https://github.com/finos/perspective/pull/640) ([texodus](https://github.com/texodus))
- Refactor [\#639](https://github.com/finos/perspective/pull/639) ([texodus](https://github.com/texodus))
- Fix debug builds [\#637](https://github.com/finos/perspective/pull/637) ([sc1f](https://github.com/sc1f))
- Don't use transferable for WASM payload [\#635](https://github.com/finos/perspective/pull/635) ([texodus](https://github.com/texodus))
- Fixed async loading of node.js module [\#634](https://github.com/finos/perspective/pull/634) ([texodus](https://github.com/texodus))

## [v0.3.1](https://github.com/finos/perspective/tree/v0.3.1) (2019-06-25)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.0...v0.3.1)

**Implemented enhancements:**

- Use exposed TableData, Schema, and TableOptions for phosphor methods [\#623](https://github.com/finos/perspective/issues/623)

**Fixed bugs:**

- Can't use index and limit on arrow  [\#627](https://github.com/finos/perspective/issues/627)
- Update perspective-phosphor documentation [\#622](https://github.com/finos/perspective/issues/622)
- Expose update on phosphor widget [\#621](https://github.com/finos/perspective/issues/621)
- notifyResize no longer properly bound on size change \(look at mutation observer code\) [\#620](https://github.com/finos/perspective/issues/620)
- Phosphor and JupyterLab bug and regression fixes [\#625](https://github.com/finos/perspective/pull/625) ([timkpaine](https://github.com/timkpaine))

**Merged pull requests:**

- Fixed safari hypergrid rendering [\#632](https://github.com/finos/perspective/pull/632) ([texodus](https://github.com/texodus))
- Update Babel `preset-env` [\#631](https://github.com/finos/perspective/pull/631) ([texodus](https://github.com/texodus))
- Use MODULARIZE emscripten option instead of a custom one [\#630](https://github.com/finos/perspective/pull/630) ([texodus](https://github.com/texodus))
- Remove support for ASM.JS, Internet Explorer and other non-WASM browsers [\#629](https://github.com/finos/perspective/pull/629) ([texodus](https://github.com/texodus))
- Memory usage fixes [\#628](https://github.com/finos/perspective/pull/628) ([texodus](https://github.com/texodus))

## [v0.3.0](https://github.com/finos/perspective/tree/v0.3.0) (2019-06-10)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.0-rc.4...v0.3.0)

**Implemented enhancements:**

- Allow transfer as columns [\#607](https://github.com/finos/perspective/pull/607) ([timkpaine](https://github.com/timkpaine))

**Merged pull requests:**

- Webpack perf [\#615](https://github.com/finos/perspective/pull/615) ([texodus](https://github.com/texodus))
- Updated website [\#614](https://github.com/finos/perspective/pull/614) ([texodus](https://github.com/texodus))
- Make "view" attribute of `\<perspective-viewer\>` backwards compatible [\#611](https://github.com/finos/perspective/pull/611) ([texodus](https://github.com/texodus))
- Made drag/drop zones more generous [\#610](https://github.com/finos/perspective/pull/610) ([texodus](https://github.com/texodus))
- Fixed split-axis y\_line charts in D3FC [\#609](https://github.com/finos/perspective/pull/609) ([texodus](https://github.com/texodus))
- Restore highcharts on phosphor/jlab until d3 is complete [\#608](https://github.com/finos/perspective/pull/608) ([timkpaine](https://github.com/timkpaine))
- Sync refactor [\#606](https://github.com/finos/perspective/pull/606) ([texodus](https://github.com/texodus))

## [v0.3.0-rc.4](https://github.com/finos/perspective/tree/v0.3.0-rc.4) (2019-05-30)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.0-rc.3...v0.3.0-rc.4)

**Implemented enhancements:**

- `on\_update` improvements [\#496](https://github.com/finos/perspective/issues/496)

**Merged pull requests:**

- Replace "distinct count" default aggregate with "count" [\#604](https://github.com/finos/perspective/pull/604) ([texodus](https://github.com/texodus))
- Replace atomic [\#603](https://github.com/finos/perspective/pull/603) ([texodus](https://github.com/texodus))

## [v0.3.0-rc.3](https://github.com/finos/perspective/tree/v0.3.0-rc.3) (2019-05-28)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.0-rc.2...v0.3.0-rc.3)

**Implemented enhancements:**

- A few quality-of-life improvements for perspective-phosphor [\#591](https://github.com/finos/perspective/pull/591) ([timkpaine](https://github.com/timkpaine))

**Merged pull requests:**

- Clean up API names [\#600](https://github.com/finos/perspective/pull/600) ([texodus](https://github.com/texodus))
- D3FC Default Plugin [\#599](https://github.com/finos/perspective/pull/599) ([texodus](https://github.com/texodus))
- simplify python setup.py, add psp\_test to python tests [\#596](https://github.com/finos/perspective/pull/596) ([timkpaine](https://github.com/timkpaine))
- Fixed D3FC heatmap color for Material dark theme. [\#595](https://github.com/finos/perspective/pull/595) ([texodus](https://github.com/texodus))
- Row delta fixes [\#594](https://github.com/finos/perspective/pull/594) ([texodus](https://github.com/texodus))
- Fix for webpack 4 themes generation error on Windows [\#590](https://github.com/finos/perspective/pull/590) ([texodus](https://github.com/texodus))
- Row deltas return arrow-serialized data [\#589](https://github.com/finos/perspective/pull/589) ([sc1f](https://github.com/sc1f))

## [v0.3.0-rc.2](https://github.com/finos/perspective/tree/v0.3.0-rc.2) (2019-05-22)

[Full Changelog](https://github.com/finos/perspective/compare/v0.3.0-rc.1...v0.3.0-rc.2)

**Implemented enhancements:**

- Expose extra configuration in JupyterLab widget [\#565](https://github.com/finos/perspective/issues/565)
- Fixed tooltip value when split\_values and multiple main values [\#583](https://github.com/finos/perspective/pull/583) ([DevAndyLee](https://github.com/DevAndyLee))
- Added y-axis split to area, y-scatter and column charts  [\#581](https://github.com/finos/perspective/pull/581) ([DevAndyLee](https://github.com/DevAndyLee))
- add restyle to type definitions, fix dark mode in jlab, fix CSS issue [\#578](https://github.com/finos/perspective/pull/578) ([timkpaine](https://github.com/timkpaine))
- JupyterLab enhancements [\#570](https://github.com/finos/perspective/pull/570) ([timkpaine](https://github.com/timkpaine))
- Feature/dual y axis POC [\#564](https://github.com/finos/perspective/pull/564) ([matt-hooper](https://github.com/matt-hooper))
- D3 Treemaps [\#563](https://github.com/finos/perspective/pull/563) ([matt-hooper](https://github.com/matt-hooper))

**Fixed bugs:**

- \[D3FC\] - Charts do not handle large numerical values on the Y-axis [\#562](https://github.com/finos/perspective/issues/562)

**Merged pull requests:**

- New benchmark suite [\#588](https://github.com/finos/perspective/pull/588) ([texodus](https://github.com/texodus))
- Port to Webpack 4 [\#587](https://github.com/finos/perspective/pull/587) ([texodus](https://github.com/texodus))
- Update CONTRIBUTING.md [\#584](https://github.com/finos/perspective/pull/584) ([brooklynrob](https://github.com/brooklynrob))
- Row delta supports addition, delete, non-contiguous updates [\#582](https://github.com/finos/perspective/pull/582) ([sc1f](https://github.com/sc1f))
- Undo condensed column layout when width \< 600px [\#580](https://github.com/finos/perspective/pull/580) ([texodus](https://github.com/texodus))
- Fixed grid styling [\#576](https://github.com/finos/perspective/pull/576) ([texodus](https://github.com/texodus))
- UX fixes [\#575](https://github.com/finos/perspective/pull/575) ([texodus](https://github.com/texodus))
- Performance overhaul for `table.update\(\)` [\#574](https://github.com/finos/perspective/pull/574) ([texodus](https://github.com/texodus))
- Fix the format of long numbers [\#573](https://github.com/finos/perspective/pull/573) ([matt-hooper](https://github.com/matt-hooper))
- Feature/treemap enhancements [\#572](https://github.com/finos/perspective/pull/572) ([redbearsam](https://github.com/redbearsam))
- Refactor Javascript API +add documentation [\#571](https://github.com/finos/perspective/pull/571) ([sc1f](https://github.com/sc1f))
- Correctly read and generate boolean values for Arrow format [\#561](https://github.com/finos/perspective/pull/561) ([sc1f](https://github.com/sc1f))
- Fixed docs links [\#559](https://github.com/finos/perspective/pull/559) ([texodus](https://github.com/texodus))

## [v0.3.0-rc.1](https://github.com/finos/perspective/tree/v0.3.0-rc.1) (2019-04-30)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.23...v0.3.0-rc.1)

**Implemented enhancements:**

- \[D3FC\] Non-numeric axes on X/Y scatter charts [\#499](https://github.com/finos/perspective/issues/499)
- Add 'styleElement' method to tell perspective-viewer to restyle picking up css changes [\#553](https://github.com/finos/perspective/pull/553) ([zemeolotu](https://github.com/zemeolotu))
- Remove 'aggregate' syntax in engine [\#552](https://github.com/finos/perspective/pull/552) ([sc1f](https://github.com/sc1f))

**Fixed bugs:**

- \[D3FC\] Clipping x-axis labels [\#500](https://github.com/finos/perspective/issues/500)

**Merged pull requests:**

- Transfer perspective to finos [\#558](https://github.com/finos/perspective/pull/558) ([texodus](https://github.com/texodus))
- Filter control auto-focuses when dropped or modified [\#557](https://github.com/finos/perspective/pull/557) ([texodus](https://github.com/texodus))
- Fixed issue when \# of charts changes in highcharts multichart mode [\#556](https://github.com/finos/perspective/pull/556) ([texodus](https://github.com/texodus))
- D3fc default [\#551](https://github.com/finos/perspective/pull/551) ([texodus](https://github.com/texodus))

## [v0.2.23](https://github.com/finos/perspective/tree/v0.2.23) (2019-04-22)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.22...v0.2.23)

**Closed issues:**

- feature request : add support to cross filtering [\#510](https://github.com/finos/perspective/issues/510)

**Merged pull requests:**

- Misc cleanup [\#550](https://github.com/finos/perspective/pull/550) ([texodus](https://github.com/texodus))
- Added table ownership flag to `\<perspective-viewer\>` `delete\(\)` method [\#549](https://github.com/finos/perspective/pull/549) ([texodus](https://github.com/texodus))
- Remote arrow [\#547](https://github.com/finos/perspective/pull/547) ([texodus](https://github.com/texodus))
- Hypergrid hover theme fix [\#546](https://github.com/finos/perspective/pull/546) ([texodus](https://github.com/texodus))
- Link click event example in README [\#545](https://github.com/finos/perspective/pull/545) ([JHawk](https://github.com/JHawk))
- Called save and restore with the correct context [\#544](https://github.com/finos/perspective/pull/544) ([Ro4052](https://github.com/Ro4052))
- Fixed hypergrid formatting issue when only row-pivots are changed [\#542](https://github.com/finos/perspective/pull/542) ([texodus](https://github.com/texodus))
- Refactored data\_slice to return t\_tscalar [\#541](https://github.com/finos/perspective/pull/541) ([texodus](https://github.com/texodus))
- Remove header rows for column-only views [\#540](https://github.com/finos/perspective/pull/540) ([sc1f](https://github.com/sc1f))

## [v0.2.22](https://github.com/finos/perspective/tree/v0.2.22) (2019-04-10)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.21...v0.2.22)

**Implemented enhancements:**

- D3fc plugin - Sunburst, color styles and bug fixes [\#511](https://github.com/finos/perspective/pull/511) ([matt-hooper](https://github.com/matt-hooper))

**Closed issues:**

- Hypergrid displays empty rows when horizontally scrolled [\#525](https://github.com/finos/perspective/issues/525)
- Column-only views in Hypergrid display an extra empty row [\#522](https://github.com/finos/perspective/issues/522)
- documentation how to use D3FC [\#509](https://github.com/finos/perspective/issues/509)
- API differences between viewer component and table.view [\#316](https://github.com/finos/perspective/issues/316)

**Merged pull requests:**

- Updated Puppeteer docker image [\#539](https://github.com/finos/perspective/pull/539) ([texodus](https://github.com/texodus))
- Hypergrid missing columns fix [\#538](https://github.com/finos/perspective/pull/538) ([texodus](https://github.com/texodus))
- Upgraded Emscripten to 1.38.29 [\#537](https://github.com/finos/perspective/pull/537) ([texodus](https://github.com/texodus))
- Updated benchmarked versions  [\#536](https://github.com/finos/perspective/pull/536) ([texodus](https://github.com/texodus))
- D3fc plugin - Resizable legend and other tweaks [\#534](https://github.com/finos/perspective/pull/534) ([matt-hooper](https://github.com/matt-hooper))
- Updated benchmarks, removed IS\_DELTA flag [\#533](https://github.com/finos/perspective/pull/533) ([texodus](https://github.com/texodus))
- Added save\(\) and restore\(\) methods to plugin API [\#532](https://github.com/finos/perspective/pull/532) ([texodus](https://github.com/texodus))
- Sort by hidden [\#531](https://github.com/finos/perspective/pull/531) ([texodus](https://github.com/texodus))
- Removed old files [\#530](https://github.com/finos/perspective/pull/530) ([texodus](https://github.com/texodus))
- Column sort fix [\#529](https://github.com/finos/perspective/pull/529) ([texodus](https://github.com/texodus))
- Fixed header click behavior to not resize or scroll grid [\#528](https://github.com/finos/perspective/pull/528) ([texodus](https://github.com/texodus))
- API Refactor [\#527](https://github.com/finos/perspective/pull/527) ([texodus](https://github.com/texodus))
- Fully implement data slice API [\#526](https://github.com/finos/perspective/pull/526) ([sc1f](https://github.com/sc1f))
- Fix issue \#522: row count is correct on column-only views [\#523](https://github.com/finos/perspective/pull/523) ([sc1f](https://github.com/sc1f))
- Fixed Hypergrid scroll stuttering [\#521](https://github.com/finos/perspective/pull/521) ([texodus](https://github.com/texodus))
- Fixed `docs` task [\#520](https://github.com/finos/perspective/pull/520) ([texodus](https://github.com/texodus))
- Add row delta to View [\#517](https://github.com/finos/perspective/pull/517) ([sc1f](https://github.com/sc1f))

## [v0.2.21](https://github.com/finos/perspective/tree/v0.2.21) (2019-04-03)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.20...v0.2.21)

**Implemented enhancements:**

- Preparation for merging of perspective-python [\#515](https://github.com/finos/perspective/pull/515) ([timkpaine](https://github.com/timkpaine))
- Make row titles configurable via plugin API [\#512](https://github.com/finos/perspective/pull/512) ([texodus](https://github.com/texodus))
- D3fc plugin [\#498](https://github.com/finos/perspective/pull/498) ([matt-hooper](https://github.com/matt-hooper))
- D3fc plugin - Basic OHLC and Candlestick charts [\#488](https://github.com/finos/perspective/pull/488) ([matt-hooper](https://github.com/matt-hooper))

**Fixed bugs:**

- Column gets removed from active columns when dragged to filter widget [\#438](https://github.com/finos/perspective/issues/438)

**Closed issues:**

- on\_update callback breaks in browser when mode is specified [\#518](https://github.com/finos/perspective/issues/518)
- Pull JupyterLab widget version from package.json [\#423](https://github.com/finos/perspective/issues/423)

**Merged pull requests:**

- `on\_update` fix [\#519](https://github.com/finos/perspective/pull/519) ([texodus](https://github.com/texodus))
- New package `perspective-cli` [\#516](https://github.com/finos/perspective/pull/516) ([texodus](https://github.com/texodus))
- Fixed merge error in new plugin API access to `view.config` [\#507](https://github.com/finos/perspective/pull/507) ([texodus](https://github.com/texodus))
- Hypergrid virtual columns & sort by click [\#506](https://github.com/finos/perspective/pull/506) ([texodus](https://github.com/texodus))
- Added `get\_config\(\)` API to `view` [\#503](https://github.com/finos/perspective/pull/503) ([texodus](https://github.com/texodus))
- Fixed expand/collapse on 2-sided pivots [\#502](https://github.com/finos/perspective/pull/502) ([texodus](https://github.com/texodus))
- Fix pivot null update bug [\#501](https://github.com/finos/perspective/pull/501) ([texodus](https://github.com/texodus))
- Local puppeteer [\#497](https://github.com/finos/perspective/pull/497) ([texodus](https://github.com/texodus))
- `on\_update` delta calculations are now lazy [\#495](https://github.com/finos/perspective/pull/495) ([texodus](https://github.com/texodus))
- D3FC unit test [\#494](https://github.com/finos/perspective/pull/494) ([texodus](https://github.com/texodus))
- Fix sum abs agg [\#493](https://github.com/finos/perspective/pull/493) ([JHawk](https://github.com/JHawk))
- Do not show number on header indicator if only one column is sorted [\#492](https://github.com/finos/perspective/pull/492) ([zemeolotu](https://github.com/zemeolotu))
- Fix webpack config load path [\#491](https://github.com/finos/perspective/pull/491) ([JHawk](https://github.com/JHawk))
- Ensure that filter column stays active when filtering [\#490](https://github.com/finos/perspective/pull/490) ([JHawk](https://github.com/JHawk))
- Header sort indicator [\#489](https://github.com/finos/perspective/pull/489) ([texodus](https://github.com/texodus))
- Fixed lint\_cpp script [\#487](https://github.com/finos/perspective/pull/487) ([texodus](https://github.com/texodus))
- Fixed 0-sided schema [\#486](https://github.com/finos/perspective/pull/486) ([texodus](https://github.com/texodus))
- Added window support to `to\_arrow\(\)` [\#485](https://github.com/finos/perspective/pull/485) ([texodus](https://github.com/texodus))
- D3fc plugin - "Nearby" tooltips for some charts [\#484](https://github.com/finos/perspective/pull/484) ([matt-hooper](https://github.com/matt-hooper))

## [v0.2.20](https://github.com/finos/perspective/tree/v0.2.20) (2019-03-07)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.19...v0.2.20)

**Implemented enhancements:**

- Add Windows build support for Javascript packages [\#462](https://github.com/finos/perspective/issues/462)
- \[enhancement\] cell selection event [\#201](https://github.com/finos/perspective/issues/201)
- D3fc plugin - area and heatmap charts [\#463](https://github.com/finos/perspective/pull/463) ([redbearsam](https://github.com/redbearsam))

**Fixed bugs:**

- perspective-jupyterlab not publishing to dist package [\#442](https://github.com/finos/perspective/issues/442)
- "shared\_worker" is not exported from perspective typings [\#440](https://github.com/finos/perspective/issues/440)
- load\(\) and update\(\) error for perspective-viewer [\#321](https://github.com/finos/perspective/issues/321)

**Closed issues:**

- Feature \(or example\) request: Column repositioning [\#472](https://github.com/finos/perspective/issues/472)

**Merged pull requests:**

- Fixed “not in” filter to array conversion in viewer [\#477](https://github.com/finos/perspective/pull/477) ([texodus](https://github.com/texodus))
- Fixed calls to `update\(\)` with empty list from throwing exception [\#476](https://github.com/finos/perspective/pull/476) ([texodus](https://github.com/texodus))
- Added ‘not in’ filter to `perspective-viewer` defaults [\#475](https://github.com/finos/perspective/pull/475) ([texodus](https://github.com/texodus))
- D3FC fixes [\#474](https://github.com/finos/perspective/pull/474) ([texodus](https://github.com/texodus))
- Add t\_data\_slice for data output [\#473](https://github.com/finos/perspective/pull/473) ([sc1f](https://github.com/sc1f))
- CSV integer parse bug [\#471](https://github.com/finos/perspective/pull/471) ([texodus](https://github.com/texodus))
- Fix for Juypterlab build-\>dist [\#470](https://github.com/finos/perspective/pull/470) ([texodus](https://github.com/texodus))
- Update remote API to accept a `perspective.table\(\)` [\#469](https://github.com/finos/perspective/pull/469) ([texodus](https://github.com/texodus))
- Ported Javascript build, test and clean tasks to Windows [\#468](https://github.com/finos/perspective/pull/468) ([texodus](https://github.com/texodus))
- Updated README [\#465](https://github.com/finos/perspective/pull/465) ([texodus](https://github.com/texodus))
- Add perspective click to usage [\#464](https://github.com/finos/perspective/pull/464) ([JHawk](https://github.com/JHawk))

## [v0.2.19](https://github.com/finos/perspective/tree/v0.2.19) (2019-03-01)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.18...v0.2.19)

**Merged pull requests:**

- Click event fix [\#461](https://github.com/finos/perspective/pull/461) ([texodus](https://github.com/texodus))
- Integration tests for D3FC [\#458](https://github.com/finos/perspective/pull/458) ([texodus](https://github.com/texodus))

## [v0.2.18](https://github.com/finos/perspective/tree/v0.2.18) (2019-02-27)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.17...v0.2.18)

**Merged pull requests:**

- Added missing `@babel/runtime` dependency [\#459](https://github.com/finos/perspective/pull/459) ([texodus](https://github.com/texodus))

## [v0.2.17](https://github.com/finos/perspective/tree/v0.2.17) (2019-02-27)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.16...v0.2.17)

**Implemented enhancements:**

- Add high chart click interactions [\#444](https://github.com/finos/perspective/pull/444) ([JHawk](https://github.com/JHawk))
- D3fc plugin [\#420](https://github.com/finos/perspective/pull/420) ([redbearsam](https://github.com/redbearsam))

**Fixed bugs:**

- perspective-jupyterlab not publishing to hist package [\#441](https://github.com/finos/perspective/issues/441)

**Merged pull requests:**

- Removed NPM caching from travis config [\#457](https://github.com/finos/perspective/pull/457) ([texodus](https://github.com/texodus))
- Updated AUTHORS [\#456](https://github.com/finos/perspective/pull/456) ([texodus](https://github.com/texodus))
- Fixes for `clean` and `bench` development scripts [\#455](https://github.com/finos/perspective/pull/455) ([texodus](https://github.com/texodus))
- Fixed babel compilation in `perspective-d3fc-plugin` package [\#454](https://github.com/finos/perspective/pull/454) ([texodus](https://github.com/texodus))
- Added `shared\_worker\(\)` to ts definition [\#453](https://github.com/finos/perspective/pull/453) ([texodus](https://github.com/texodus))
- Port view to C++ [\#452](https://github.com/finos/perspective/pull/452) ([sc1f](https://github.com/sc1f))
- Fixed Github reported dependency vulnerabilities [\#451](https://github.com/finos/perspective/pull/451) ([texodus](https://github.com/texodus))
- Moved `perspective-jupyterlab` build from `build/` to `dist/` to work… [\#450](https://github.com/finos/perspective/pull/450) ([texodus](https://github.com/texodus))
- Add tests for filtering datetime columns by string [\#449](https://github.com/finos/perspective/pull/449) ([sc1f](https://github.com/sc1f))
- Build cleanup [\#448](https://github.com/finos/perspective/pull/448) ([texodus](https://github.com/texodus))
- Fix regression on view expand [\#445](https://github.com/finos/perspective/pull/445) ([sc1f](https://github.com/sc1f))
- Interactions click dispatch [\#439](https://github.com/finos/perspective/pull/439) ([JHawk](https://github.com/JHawk))
- Purges phosphor and jlab tests  [\#437](https://github.com/finos/perspective/pull/437) ([timkpaine](https://github.com/timkpaine))

## [v0.2.16](https://github.com/finos/perspective/tree/v0.2.16) (2019-02-19)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.15...v0.2.16)

**Implemented enhancements:**

- Phosphor bindings [\#436](https://github.com/finos/perspective/pull/436) ([texodus](https://github.com/texodus))
- Write arrows [\#435](https://github.com/finos/perspective/pull/435) ([texodus](https://github.com/texodus))
- Make sort syntax consistent in tests [\#434](https://github.com/finos/perspective/pull/434) ([sc1f](https://github.com/sc1f))
- Allow mac failures on travis, have travis fail fast [\#428](https://github.com/finos/perspective/pull/428) ([timkpaine](https://github.com/timkpaine))
- Tidy up dependencies [\#427](https://github.com/finos/perspective/pull/427) ([LukeSheard](https://github.com/LukeSheard))
- C++ subproject [\#426](https://github.com/finos/perspective/pull/426) ([texodus](https://github.com/texodus))
- Better python build for location of shared objects.  [\#415](https://github.com/finos/perspective/pull/415) ([timkpaine](https://github.com/timkpaine))

**Closed issues:**

- Integrate appveyor build/badge [\#411](https://github.com/finos/perspective/issues/411)

**Merged pull requests:**

- Add `replace\(\)` and `clear\(\)` to table [\#431](https://github.com/finos/perspective/pull/431) ([texodus](https://github.com/texodus))
- fixes \#411 [\#424](https://github.com/finos/perspective/pull/424) ([timkpaine](https://github.com/timkpaine))
- 0.2.15 changelog [\#422](https://github.com/finos/perspective/pull/422) ([texodus](https://github.com/texodus))
- adding autodocumentation for python and C++ [\#414](https://github.com/finos/perspective/pull/414) ([timkpaine](https://github.com/timkpaine))
- Port View to C++ [\#413](https://github.com/finos/perspective/pull/413) ([sc1f](https://github.com/sc1f))

## [v0.2.15](https://github.com/finos/perspective/tree/v0.2.15) (2019-02-07)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.14...v0.2.15)

**Fixed bugs:**

- Fresh npm install of @jpmorganchase/perspective, seems to be missing "fast-async"  [\#410](https://github.com/finos/perspective/issues/410)

**Merged pull requests:**

- String column promotion [\#421](https://github.com/finos/perspective/pull/421) ([texodus](https://github.com/texodus))
- Fixed cross origin detection bug [\#419](https://github.com/finos/perspective/pull/419) ([texodus](https://github.com/texodus))
- limit to a single build \(15 minutes\) until we have more resources [\#418](https://github.com/finos/perspective/pull/418) ([timkpaine](https://github.com/timkpaine))
- `null` category axis fix [\#416](https://github.com/finos/perspective/pull/416) ([texodus](https://github.com/texodus))
- Fix isCrossOrigin function issue for non-webpack builds  [\#412](https://github.com/finos/perspective/pull/412) ([LukeSheard](https://github.com/LukeSheard))

## [v0.2.14](https://github.com/finos/perspective/tree/v0.2.14) (2019-02-04)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.13...v0.2.14)

**Merged pull requests:**

- Webpack fix [\#409](https://github.com/finos/perspective/pull/409) ([texodus](https://github.com/texodus))
- Added `flush\(\)` method to `\<perspective-viewer\>` [\#408](https://github.com/finos/perspective/pull/408) ([texodus](https://github.com/texodus))

## [v0.2.13](https://github.com/finos/perspective/tree/v0.2.13) (2019-02-04)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.12...v0.2.13)

**Implemented enhancements:**

- UI filters should give user feedback when they are valid [\#349](https://github.com/finos/perspective/issues/349)

**Fixed bugs:**

- Infer Schema functionality breaks some examples [\#368](https://github.com/finos/perspective/issues/368)

**Merged pull requests:**

- Date parsing bug [\#407](https://github.com/finos/perspective/pull/407) ([texodus](https://github.com/texodus))
- Fixed CSS regression in Chrome canary, fixed example docs [\#405](https://github.com/finos/perspective/pull/405) ([texodus](https://github.com/texodus))
- add another IEX demo [\#404](https://github.com/finos/perspective/pull/404) ([timkpaine](https://github.com/timkpaine))
- Add publicPath support to webpack-plugin  [\#403](https://github.com/finos/perspective/pull/403) ([LukeSheard](https://github.com/LukeSheard))
- expand os for c++ testing [\#402](https://github.com/finos/perspective/pull/402) ([timkpaine](https://github.com/timkpaine))
- adding iex streaming example to readme [\#401](https://github.com/finos/perspective/pull/401) ([timkpaine](https://github.com/timkpaine))
- Point README links to blocks [\#400](https://github.com/finos/perspective/pull/400) ([JHawk](https://github.com/JHawk))
- perspective-webpack-plugin [\#399](https://github.com/finos/perspective/pull/399) ([texodus](https://github.com/texodus))
- Adding FINOS badge [\#397](https://github.com/finos/perspective/pull/397) ([texodus](https://github.com/texodus))
- C++ Date Validation [\#396](https://github.com/finos/perspective/pull/396) ([sc1f](https://github.com/sc1f))
- Benchmark limit + minor changes to DataAccessor [\#395](https://github.com/finos/perspective/pull/395) ([sc1f](https://github.com/sc1f))
- Websocket heartbeat detection [\#394](https://github.com/finos/perspective/pull/394) ([dknfeiov](https://github.com/dknfeiov))
- Update Webpack example to webpack 4 [\#393](https://github.com/finos/perspective/pull/393) ([LukeSheard](https://github.com/LukeSheard))
- Output CJS files perspective package [\#392](https://github.com/finos/perspective/pull/392) ([LukeSheard](https://github.com/LukeSheard))
- Output CJS module bundles for perspective-viewer packages [\#391](https://github.com/finos/perspective/pull/391) ([LukeSheard](https://github.com/LukeSheard))
- Remove cross /src imports in packages [\#390](https://github.com/finos/perspective/pull/390) ([LukeSheard](https://github.com/LukeSheard))
- \[WIP\] Merging JS and Python binding code - Part 2 [\#389](https://github.com/finos/perspective/pull/389) ([timkpaine](https://github.com/timkpaine))
- Empty filters [\#387](https://github.com/finos/perspective/pull/387) ([Ro4052](https://github.com/Ro4052))

## [v0.2.12](https://github.com/finos/perspective/tree/v0.2.12) (2019-01-18)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.11...v0.2.12)

**Implemented enhancements:**

- Rely on CMake variable for debug configuration instead of PSP\_DEBUG environment variable [\#377](https://github.com/finos/perspective/issues/377)
- Unclear tranpose button [\#347](https://github.com/finos/perspective/issues/347)
- C++ tests [\#383](https://github.com/finos/perspective/pull/383) ([texodus](https://github.com/texodus))
- Interoperability between CMAKE\_BUILD\_TYPE and PSP\_DEBUG [\#381](https://github.com/finos/perspective/pull/381) ([timkpaine](https://github.com/timkpaine))
- Invalid filters [\#375](https://github.com/finos/perspective/pull/375) ([Ro4052](https://github.com/Ro4052))
- remove boost::format [\#374](https://github.com/finos/perspective/pull/374) ([timkpaine](https://github.com/timkpaine))
- reorganize cpp test directory for better organization [\#371](https://github.com/finos/perspective/pull/371) ([timkpaine](https://github.com/timkpaine))

**Fixed bugs:**

- Activating `build\_worker` in webpack plugin breaks builds [\#379](https://github.com/finos/perspective/issues/379)
- PerspectivePlugin lack dependencies [\#318](https://github.com/finos/perspective/issues/318)
- Tooltip tests occasionally fail. [\#210](https://github.com/finos/perspective/issues/210)
- Fixes local cpp build -\> need to cd into build dir \(not needed on docker, working dir is set\) [\#373](https://github.com/finos/perspective/pull/373) ([timkpaine](https://github.com/timkpaine))

**Closed issues:**

- Missing dependencies for perspective [\#359](https://github.com/finos/perspective/issues/359)

**Merged pull requests:**

- Re-enable cpp warnings [\#386](https://github.com/finos/perspective/pull/386) ([texodus](https://github.com/texodus))
- Debug fix [\#385](https://github.com/finos/perspective/pull/385) ([texodus](https://github.com/texodus))
- Correctly type parse numbers wrapped in strings [\#370](https://github.com/finos/perspective/pull/370) ([sc1f](https://github.com/sc1f))
- fix mac ending [\#369](https://github.com/finos/perspective/pull/369) ([timkpaine](https://github.com/timkpaine))
- Promote column [\#367](https://github.com/finos/perspective/pull/367) ([texodus](https://github.com/texodus))
- adding readme for python [\#366](https://github.com/finos/perspective/pull/366) ([timkpaine](https://github.com/timkpaine))
- Test and lint python [\#365](https://github.com/finos/perspective/pull/365) ([timkpaine](https://github.com/timkpaine))
- Add missing dependencies [\#364](https://github.com/finos/perspective/pull/364) ([texodus](https://github.com/texodus))
- Python build fix [\#363](https://github.com/finos/perspective/pull/363) ([texodus](https://github.com/texodus))
- Fix merge error with renamed types \#358 [\#361](https://github.com/finos/perspective/pull/361) ([timkpaine](https://github.com/timkpaine))
- Removed regenerator-plugin in favor of fast-async [\#357](https://github.com/finos/perspective/pull/357) ([texodus](https://github.com/texodus))
- Python Bindings [\#356](https://github.com/finos/perspective/pull/356) ([timkpaine](https://github.com/timkpaine))
- Removed type abstractions [\#355](https://github.com/finos/perspective/pull/355) ([texodus](https://github.com/texodus))
- Test quality-of-life updates [\#354](https://github.com/finos/perspective/pull/354) ([sc1f](https://github.com/sc1f))
- Build & performance fixes [\#353](https://github.com/finos/perspective/pull/353) ([texodus](https://github.com/texodus))
- Unified data access interface [\#352](https://github.com/finos/perspective/pull/352) ([sc1f](https://github.com/sc1f))
- Adding test harness for jupyterlab extension [\#351](https://github.com/finos/perspective/pull/351) ([timkpaine](https://github.com/timkpaine))

## [v0.2.11](https://github.com/finos/perspective/tree/v0.2.11) (2018-12-20)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.10...v0.2.11)

**Fixed bugs:**

- Filters on datetime columns break [\#291](https://github.com/finos/perspective/issues/291)

**Merged pull requests:**

- New benchmarks [\#350](https://github.com/finos/perspective/pull/350) ([texodus](https://github.com/texodus))
- Change transpose button to two-way arrow [\#348](https://github.com/finos/perspective/pull/348) ([Ro4052](https://github.com/Ro4052))
- making cpp a first class citizen again [\#346](https://github.com/finos/perspective/pull/346) ([timkpaine](https://github.com/timkpaine))
- adding support for apache arrow in jlab [\#345](https://github.com/finos/perspective/pull/345) ([timkpaine](https://github.com/timkpaine))
- Fix \#291 Null values in filters [\#344](https://github.com/finos/perspective/pull/344) ([jburton-scottlogic](https://github.com/jburton-scottlogic))
- Empty string column type inference fix [\#343](https://github.com/finos/perspective/pull/343) ([texodus](https://github.com/texodus))

## [v0.2.10](https://github.com/finos/perspective/tree/v0.2.10) (2018-12-10)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.9...v0.2.10)

**Merged pull requests:**

- Cleanup for port\_data\_parser branch [\#339](https://github.com/finos/perspective/pull/339) ([texodus](https://github.com/texodus))
- Visual polish [\#338](https://github.com/finos/perspective/pull/338) ([texodus](https://github.com/texodus))
- Test stability [\#337](https://github.com/finos/perspective/pull/337) ([texodus](https://github.com/texodus))
- Port data\_types and get\_data\_type [\#336](https://github.com/finos/perspective/pull/336) ([sc1f](https://github.com/sc1f))
- Build into dist, plays nicer with ipywidgets [\#335](https://github.com/finos/perspective/pull/335) ([timkpaine](https://github.com/timkpaine))
- Port infer\_type and column\_names to C++ [\#334](https://github.com/finos/perspective/pull/334) ([sc1f](https://github.com/sc1f))
- Parallel tests [\#332](https://github.com/finos/perspective/pull/332) ([texodus](https://github.com/texodus))
- Material fixes [\#330](https://github.com/finos/perspective/pull/330) ([texodus](https://github.com/texodus))
- Refactor parse\_data [\#329](https://github.com/finos/perspective/pull/329) ([sc1f](https://github.com/sc1f))
- Viewer memory leak on delete\(\) [\#328](https://github.com/finos/perspective/pull/328) ([texodus](https://github.com/texodus))

## [v0.2.9](https://github.com/finos/perspective/tree/v0.2.9) (2018-11-26)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.8...v0.2.9)

**Closed issues:**

- about supported for utf-8 encoding  [\#323](https://github.com/finos/perspective/issues/323)

**Merged pull requests:**

- UX Cleanup [\#327](https://github.com/finos/perspective/pull/327) ([texodus](https://github.com/texodus))
- Fun Animations! [\#326](https://github.com/finos/perspective/pull/326) ([texodus](https://github.com/texodus))
- Full column sort [\#325](https://github.com/finos/perspective/pull/325) ([texodus](https://github.com/texodus))
- Added a new example [\#324](https://github.com/finos/perspective/pull/324) ([ColinEberhardt](https://github.com/ColinEberhardt))
- Use Yarn workspaces as a drop-in for Lerna [\#320](https://github.com/finos/perspective/pull/320) ([LukeSheard](https://github.com/LukeSheard))

## [v0.2.8](https://github.com/finos/perspective/tree/v0.2.8) (2018-11-21)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.7...v0.2.8)

**Implemented enhancements:**

- Sorting on a `view` with column pivots applied, should default to sorting on the row header value [\#216](https://github.com/finos/perspective/issues/216)

**Fixed bugs:**

- "multiple single element removes" test fails intermittently under mysterious circumstances [\#270](https://github.com/finos/perspective/issues/270)

**Closed issues:**

- Is it possible to make computed columns more flexible, supporting manual input and expressions? [\#300](https://github.com/finos/perspective/issues/300)

**Merged pull requests:**

- Column pivot sort [\#319](https://github.com/finos/perspective/pull/319) ([texodus](https://github.com/texodus))
- Context sort [\#317](https://github.com/finos/perspective/pull/317) ([texodus](https://github.com/texodus))
- Fix weighted mean null/missing value handling [\#315](https://github.com/finos/perspective/pull/315) ([neilslinger](https://github.com/neilslinger))
- Further refactored PerspectiveViewer [\#313](https://github.com/finos/perspective/pull/313) ([texodus](https://github.com/texodus))
- docs: update installation guide [\#312](https://github.com/finos/perspective/pull/312) ([ColinEberhardt](https://github.com/ColinEberhardt))
- Refactor make\_table [\#311](https://github.com/finos/perspective/pull/311) ([sc1f](https://github.com/sc1f))
- Jupyterlab plugin: Cleanup and computed columns [\#310](https://github.com/finos/perspective/pull/310) ([timkpaine](https://github.com/timkpaine))
- Typo [\#309](https://github.com/finos/perspective/pull/309) ([timkpaine](https://github.com/timkpaine))
- Added Jupyterlab plugin install docs [\#308](https://github.com/finos/perspective/pull/308) ([texodus](https://github.com/texodus))
- Jupyterlab plugin feature improvements [\#307](https://github.com/finos/perspective/pull/307) ([texodus](https://github.com/texodus))
- Fixed webpack build for Jupyterlab [\#306](https://github.com/finos/perspective/pull/306) ([texodus](https://github.com/texodus))

## [v0.2.7](https://github.com/finos/perspective/tree/v0.2.7) (2018-11-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.6...v0.2.7)

**Merged pull requests:**

- Fixed package error which excluded perspective from it's own plugin [\#304](https://github.com/finos/perspective/pull/304) ([texodus](https://github.com/texodus))

## [v0.2.6](https://github.com/finos/perspective/tree/v0.2.6) (2018-11-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.5...v0.2.6)

**Merged pull requests:**

- Integration fixes [\#303](https://github.com/finos/perspective/pull/303) ([texodus](https://github.com/texodus))
- Reorganize ViewPrivate [\#302](https://github.com/finos/perspective/pull/302) ([sc1f](https://github.com/sc1f))

## [v0.2.5](https://github.com/finos/perspective/tree/v0.2.5) (2018-11-09)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.4...v0.2.5)

**Merged pull requests:**

- Ported to babel 7 [\#301](https://github.com/finos/perspective/pull/301) ([texodus](https://github.com/texodus))

## [v0.2.4](https://github.com/finos/perspective/tree/v0.2.4) (2018-11-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.3...v0.2.4)

**Implemented enhancements:**

- Show warning when a view's size is likely to cause plugin rendering problems [\#226](https://github.com/finos/perspective/issues/226)

**Closed issues:**

- Hoist `devDependencies` to top level [\#281](https://github.com/finos/perspective/issues/281)

**Merged pull requests:**

- Toolbar [\#299](https://github.com/finos/perspective/pull/299) ([texodus](https://github.com/texodus))
- Release bugs [\#298](https://github.com/finos/perspective/pull/298) ([texodus](https://github.com/texodus))
- Move ViewPrivate into a separate file [\#297](https://github.com/finos/perspective/pull/297) ([sc1f](https://github.com/sc1f))
- Moved babel-polyfill to avoid webpack/babel bug [\#296](https://github.com/finos/perspective/pull/296) ([texodus](https://github.com/texodus))
- Worker loader [\#295](https://github.com/finos/perspective/pull/295) ([texodus](https://github.com/texodus))
- Replace \_column\_view with semantically named methods [\#294](https://github.com/finos/perspective/pull/294) ([sc1f](https://github.com/sc1f))
- Move drag/drop into separate file, clean up row, move detectIE/detectChrome from perspective into perspective-viewer [\#293](https://github.com/finos/perspective/pull/293) ([sc1f](https://github.com/sc1f))
- Refactor \_\_WORKER\_\_ into proper singleton [\#292](https://github.com/finos/perspective/pull/292) ([sc1f](https://github.com/sc1f))
- Add warnings when data to be rendered will slow down browser [\#290](https://github.com/finos/perspective/pull/290) ([sc1f](https://github.com/sc1f))

## [v0.2.3](https://github.com/finos/perspective/tree/v0.2.3) (2018-10-26)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.2...v0.2.3)

**Implemented enhancements:**

- Support `date` types [\#262](https://github.com/finos/perspective/issues/262)
- Change `restore\(\)` to be a promise which resolves on apply [\#287](https://github.com/finos/perspective/pull/287) ([texodus](https://github.com/texodus))
- Shadow DOM [\#286](https://github.com/finos/perspective/pull/286) ([texodus](https://github.com/texodus))
- Date types [\#271](https://github.com/finos/perspective/pull/271) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Hypergrid goes into a broken state when loaded with an empty `table\(\)` [\#264](https://github.com/finos/perspective/issues/264)
- Computed Column UX bugs [\#257](https://github.com/finos/perspective/issues/257)
- When calling `update` with x axis as date, new data labels aren't converted.  [\#164](https://github.com/finos/perspective/issues/164)
- Add support for handling nulls in pivot columns. [\#280](https://github.com/finos/perspective/pull/280) ([deepankarsharma](https://github.com/deepankarsharma))
- Need to specify variable name in type declaration [\#279](https://github.com/finos/perspective/pull/279) ([nmichaud](https://github.com/nmichaud))
- Computed columns broken with delta updates on non-dependent columns [\#274](https://github.com/finos/perspective/pull/274) ([nmichaud](https://github.com/nmichaud))

**Merged pull requests:**

- Fixed x axis rendering bug \#164 [\#289](https://github.com/finos/perspective/pull/289) ([texodus](https://github.com/texodus))
- Fixed empty hypergrid loading error \#264 [\#288](https://github.com/finos/perspective/pull/288) ([texodus](https://github.com/texodus))
- update to jupyterlab 0.35.x [\#284](https://github.com/finos/perspective/pull/284) ([timkpaine](https://github.com/timkpaine))
- Fix computed column UX issues [\#283](https://github.com/finos/perspective/pull/283) ([sc1f](https://github.com/sc1f))
- Added developer docs and updated contributing.md [\#282](https://github.com/finos/perspective/pull/282) ([texodus](https://github.com/texodus))
- Expansion depth should be stable across updates [\#277](https://github.com/finos/perspective/pull/277) ([nmichaud](https://github.com/nmichaud))
- Cleanup cpp api [\#275](https://github.com/finos/perspective/pull/275) ([nmichaud](https://github.com/nmichaud))
- Expose view columns as TypedArrays [\#273](https://github.com/finos/perspective/pull/273) ([sc1f](https://github.com/sc1f))
- Move C++ to top level directory [\#266](https://github.com/finos/perspective/pull/266) ([LukeSheard](https://github.com/LukeSheard))

## [v0.2.2](https://github.com/finos/perspective/tree/v0.2.2) (2018-10-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.1...v0.2.2)

**Implemented enhancements:**

- Added support for chunked arrows [\#268](https://github.com/finos/perspective/pull/268) ([texodus](https://github.com/texodus))

**Fixed bugs:**

- Canary css fix [\#269](https://github.com/finos/perspective/pull/269) ([texodus](https://github.com/texodus))

**Closed issues:**

- Unable to run perspective in observablehq notebook [\#265](https://github.com/finos/perspective/issues/265)

**Merged pull requests:**

- New examples [\#267](https://github.com/finos/perspective/pull/267) ([texodus](https://github.com/texodus))
- Can't remove from an array while iterating it's indices [\#263](https://github.com/finos/perspective/pull/263) ([nmichaud](https://github.com/nmichaud))
- Misc fixes accumulated from external PRs [\#261](https://github.com/finos/perspective/pull/261) ([texodus](https://github.com/texodus))
- Bind functions [\#260](https://github.com/finos/perspective/pull/260) ([texodus](https://github.com/texodus))
- Fixed bug which caused computed-columns creation to break updates in … [\#259](https://github.com/finos/perspective/pull/259) ([texodus](https://github.com/texodus))
- Fix bug with pkey column update with missing agg value [\#258](https://github.com/finos/perspective/pull/258) ([deepankarsharma](https://github.com/deepankarsharma))
- Added options dict to viewer load method [\#256](https://github.com/finos/perspective/pull/256) ([texodus](https://github.com/texodus))
- Add 'not in' filter operation [\#255](https://github.com/finos/perspective/pull/255) ([nmichaud](https://github.com/nmichaud))
- Added positive/negative color & font to Hypergrid CSS style [\#254](https://github.com/finos/perspective/pull/254) ([texodus](https://github.com/texodus))

## [v0.2.1](https://github.com/finos/perspective/tree/v0.2.1) (2018-10-02)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.0...v0.2.1)

**Merged pull requests:**

- IE fix [\#253](https://github.com/finos/perspective/pull/253) ([texodus](https://github.com/texodus))

## [v0.2.0](https://github.com/finos/perspective/tree/v0.2.0) (2018-10-01)

[Full Changelog](https://github.com/finos/perspective/compare/0.2.0-beta.3...v0.2.0)

**Closed issues:**

- `sort` attribute documentation is incorrect [\#209](https://github.com/finos/perspective/issues/209)

**Merged pull requests:**

- Fixed hover tooltips on y\_scatter charts [\#252](https://github.com/finos/perspective/pull/252) ([texodus](https://github.com/texodus))
- Moved LESS formatting to prettier;  added clean-css to LESS build [\#251](https://github.com/finos/perspective/pull/251) ([texodus](https://github.com/texodus))
- Updated documentation [\#250](https://github.com/finos/perspective/pull/250) ([texodus](https://github.com/texodus))
- Refactor examples [\#249](https://github.com/finos/perspective/pull/249) ([texodus](https://github.com/texodus))
- 1D charts generated from columnar data [\#231](https://github.com/finos/perspective/pull/231) ([sc1f](https://github.com/sc1f))

## [0.2.0-beta.3](https://github.com/finos/perspective/tree/0.2.0-beta.3) (2018-09-25)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.0-beta.3...0.2.0-beta.3)

## [v0.2.0-beta.3](https://github.com/finos/perspective/tree/v0.2.0-beta.3) (2018-09-25)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.0-beta.2...v0.2.0-beta.3)

**Implemented enhancements:**

- Allow searching for columns in the perspective\_viewer column chooser [\#108](https://github.com/finos/perspective/issues/108)
- Chart.js viewer [\#33](https://github.com/finos/perspective/issues/33)

**Closed issues:**

- Perspective node runtime [\#243](https://github.com/finos/perspective/issues/243)
- Add support for computed columns with multiple parameters [\#200](https://github.com/finos/perspective/issues/200)

**Merged pull requests:**

- Fixed cross origin asset resolution failure [\#248](https://github.com/finos/perspective/pull/248) ([texodus](https://github.com/texodus))
- Column resize fix refactor [\#246](https://github.com/finos/perspective/pull/246) ([texodus](https://github.com/texodus))
- Better documentation for `worker\(\)` method usage in node.js & the bro… [\#245](https://github.com/finos/perspective/pull/245) ([texodus](https://github.com/texodus))
- Clang format [\#244](https://github.com/finos/perspective/pull/244) ([texodus](https://github.com/texodus))
- Add eslint-prettier [\#242](https://github.com/finos/perspective/pull/242) ([LukeSheard](https://github.com/LukeSheard))

## [v0.2.0-beta.2](https://github.com/finos/perspective/tree/v0.2.0-beta.2) (2018-09-17)

[Full Changelog](https://github.com/finos/perspective/compare/v0.2.0-beta.1...v0.2.0-beta.2)

**Merged pull requests:**

- Added `y\_scatter` chart type [\#241](https://github.com/finos/perspective/pull/241) ([texodus](https://github.com/texodus))

## [v0.2.0-beta.1](https://github.com/finos/perspective/tree/v0.2.0-beta.1) (2018-09-17)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.18...v0.2.0-beta.1)

**Fixed bugs:**

- Perspective schema does not map aggregates to their correct types [\#183](https://github.com/finos/perspective/issues/183)

**Closed issues:**

- Please, publish to npm the jupyterlab0.34-compatible version [\#227](https://github.com/finos/perspective/issues/227)
- Multiple row removes causing memory access issues [\#193](https://github.com/finos/perspective/issues/193)

**Merged pull requests:**

- Computed persistence [\#240](https://github.com/finos/perspective/pull/240) ([texodus](https://github.com/texodus))
- Limit tables [\#239](https://github.com/finos/perspective/pull/239) ([texodus](https://github.com/texodus))
- Fixed column-oriented output with column-only pivot [\#238](https://github.com/finos/perspective/pull/238) ([texodus](https://github.com/texodus))
- WebsocketHost HTTP support + GIT example [\#237](https://github.com/finos/perspective/pull/237) ([texodus](https://github.com/texodus))
- Add ESLint [\#236](https://github.com/finos/perspective/pull/236) ([texodus](https://github.com/texodus))
- Added perspective gitter banner to README.md [\#235](https://github.com/finos/perspective/pull/235) ([texodus](https://github.com/texodus))
- Remove nested build dirs [\#234](https://github.com/finos/perspective/pull/234) ([texodus](https://github.com/texodus))
- Null fix [\#233](https://github.com/finos/perspective/pull/233) ([texodus](https://github.com/texodus))
- Added Jupyter API for incremental updates [\#230](https://github.com/finos/perspective/pull/230) ([texodus](https://github.com/texodus))
- Add Travis node\_modules caching [\#229](https://github.com/finos/perspective/pull/229) ([LukeSheard](https://github.com/LukeSheard))
- Refactored `load\(\)` method to a Promise; updated expand/collapse API … [\#228](https://github.com/finos/perspective/pull/228) ([texodus](https://github.com/texodus))
- Cpp tests [\#225](https://github.com/finos/perspective/pull/225) ([deepankarsharma](https://github.com/deepankarsharma))
- Computed columns with multiple parameters [\#223](https://github.com/finos/perspective/pull/223) ([sc1f](https://github.com/sc1f))
- Jupyterlab plugin ipywidget [\#222](https://github.com/finos/perspective/pull/222) ([texodus](https://github.com/texodus))
- Added PSP\_CPU\_COUNT env var [\#221](https://github.com/finos/perspective/pull/221) ([texodus](https://github.com/texodus))
- Simpler implementation of aggregate fix [\#220](https://github.com/finos/perspective/pull/220) ([texodus](https://github.com/texodus))
- Upgraded to emscripten 1.38.11 [\#219](https://github.com/finos/perspective/pull/219) ([texodus](https://github.com/texodus))
- Null aggregate fix [\#217](https://github.com/finos/perspective/pull/217) ([texodus](https://github.com/texodus))
- Asm.js tests [\#215](https://github.com/finos/perspective/pull/215) ([texodus](https://github.com/texodus))
- Computed columns retain persistent aggregates and show/hide [\#214](https://github.com/finos/perspective/pull/214) ([texodus](https://github.com/texodus))
- Column oriented partial update [\#208](https://github.com/finos/perspective/pull/208) ([texodus](https://github.com/texodus))
- Mean fix [\#206](https://github.com/finos/perspective/pull/206) ([texodus](https://github.com/texodus))
- Fixed typescript/webpack file resolution error [\#204](https://github.com/finos/perspective/pull/204) ([texodus](https://github.com/texodus))
- bump dependencies [\#203](https://github.com/finos/perspective/pull/203) ([timkpaine](https://github.com/timkpaine))
- More cleanup + OS X [\#202](https://github.com/finos/perspective/pull/202) ([timkpaine](https://github.com/timkpaine))
- Drop python [\#198](https://github.com/finos/perspective/pull/198) ([texodus](https://github.com/texodus))
- Computed columns [\#197](https://github.com/finos/perspective/pull/197) ([texodus](https://github.com/texodus))
- Assorted bug fixes [\#195](https://github.com/finos/perspective/pull/195) ([texodus](https://github.com/texodus))
- Memory leak fix [\#194](https://github.com/finos/perspective/pull/194) ([texodus](https://github.com/texodus))
- Allow table.update\(\) to accept partial rows [\#192](https://github.com/finos/perspective/pull/192) ([texodus](https://github.com/texodus))
- Fixed Hypergrid regression in column-only pivot [\#191](https://github.com/finos/perspective/pull/191) ([texodus](https://github.com/texodus))
- Remote performance [\#190](https://github.com/finos/perspective/pull/190) ([texodus](https://github.com/texodus))
- Fixing filters when setting multiple filters per column [\#189](https://github.com/finos/perspective/pull/189) ([msturdikova](https://github.com/msturdikova))
- Refactored remote library into regular `perspective.js` [\#188](https://github.com/finos/perspective/pull/188) ([texodus](https://github.com/texodus))
- Remote perspective [\#187](https://github.com/finos/perspective/pull/187) ([texodus](https://github.com/texodus))
- Add tests and fix for regressed column update. [\#186](https://github.com/finos/perspective/pull/186) ([RohanPadmanabhan](https://github.com/RohanPadmanabhan))
- Schema fix [\#185](https://github.com/finos/perspective/pull/185) ([texodus](https://github.com/texodus))
- Elaborated Jupyterlab plugin documentation, added example notebook [\#184](https://github.com/finos/perspective/pull/184) ([texodus](https://github.com/texodus))
- Merge from fork [\#182](https://github.com/finos/perspective/pull/182) ([texodus](https://github.com/texodus))
- Added new persistent, node.js benchmark suite [\#181](https://github.com/finos/perspective/pull/181) ([texodus](https://github.com/texodus))
- Updated webcomponentsjs [\#180](https://github.com/finos/perspective/pull/180) ([texodus](https://github.com/texodus))
- Refactor Material Theme [\#178](https://github.com/finos/perspective/pull/178) ([sc1f](https://github.com/sc1f))

## [v0.1.18](https://github.com/finos/perspective/tree/v0.1.18) (2018-08-01)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.17...v0.1.18)

**Implemented enhancements:**

- Investigate automatic wasm copying for jupyterlab webpack [\#35](https://github.com/finos/perspective/issues/35)

**Fixed bugs:**

- Grid highlight in dark mode not visible \(both regular and jupyterlab extension\) [\#160](https://github.com/finos/perspective/issues/160)
- Error running docker on OSX with ZSH and Homebrew Docker [\#138](https://github.com/finos/perspective/issues/138)

**Closed issues:**

- superstore arrow demo observable js notebook link share [\#171](https://github.com/finos/perspective/issues/171)
- perspective-viewer allows touch scroll and zoom events on mobile [\#169](https://github.com/finos/perspective/issues/169)
- xy\_line chart ignores `sort` option when plotting lines [\#165](https://github.com/finos/perspective/issues/165)
- Center of sunburst should be highlighted at all depths? [\#159](https://github.com/finos/perspective/issues/159)
- Column types assumed as int if first value is a whole number [\#13](https://github.com/finos/perspective/issues/13)

**Merged pull requests:**

- Don't exclude @apache-arrow from babel [\#177](https://github.com/finos/perspective/pull/177) ([texodus](https://github.com/texodus))
- Fixed Jest regression [\#176](https://github.com/finos/perspective/pull/176) ([texodus](https://github.com/texodus))
- Responsive sidebar [\#175](https://github.com/finos/perspective/pull/175) ([texodus](https://github.com/texodus))
- upping jlab dependencies [\#174](https://github.com/finos/perspective/pull/174) ([timkpaine](https://github.com/timkpaine))
- Better comparisons for benchmarks [\#173](https://github.com/finos/perspective/pull/173) ([texodus](https://github.com/texodus))
- Fixed hover colors [\#172](https://github.com/finos/perspective/pull/172) ([texodus](https://github.com/texodus))
- Jupyter embedded mode [\#170](https://github.com/finos/perspective/pull/170) ([texodus](https://github.com/texodus))
- fix for \#160 [\#168](https://github.com/finos/perspective/pull/168) ([timkpaine](https://github.com/timkpaine))
- Material tooltip [\#167](https://github.com/finos/perspective/pull/167) ([texodus](https://github.com/texodus))
- Run tests in parallel [\#166](https://github.com/finos/perspective/pull/166) ([texodus](https://github.com/texodus))
- small style fixes [\#163](https://github.com/finos/perspective/pull/163) ([timkpaine](https://github.com/timkpaine))
- Highcharts Tooltips [\#162](https://github.com/finos/perspective/pull/162) ([texodus](https://github.com/texodus))
- Forgo publishing cpp source code [\#161](https://github.com/finos/perspective/pull/161) ([LukeSheard](https://github.com/LukeSheard))
- Release fixes [\#158](https://github.com/finos/perspective/pull/158) ([texodus](https://github.com/texodus))
- Add typing for perspective [\#157](https://github.com/finos/perspective/pull/157) ([segarman](https://github.com/segarman))
- Split Build Steps into individual tasks [\#156](https://github.com/finos/perspective/pull/156) ([LukeSheard](https://github.com/LukeSheard))

## [v0.1.17](https://github.com/finos/perspective/tree/v0.1.17) (2018-07-10)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.16...v0.1.17)

**Closed issues:**

- CSV demo failing for multiple people [\#153](https://github.com/finos/perspective/issues/153)
- any way to get data from grid into clipboard [\#65](https://github.com/finos/perspective/issues/65)

**Merged pull requests:**

- Fixed csv.html example [\#155](https://github.com/finos/perspective/pull/155) ([texodus](https://github.com/texodus))
- Update fin-hypergrid-grouped-header-plugin to 1.2.4 [\#154](https://github.com/finos/perspective/pull/154) ([texodus](https://github.com/texodus))
- Added simple clipboard API [\#152](https://github.com/finos/perspective/pull/152) ([texodus](https://github.com/texodus))
- To csv [\#150](https://github.com/finos/perspective/pull/150) ([texodus](https://github.com/texodus))
- Hypergrid expand/collapse on tree columns. [\#148](https://github.com/finos/perspective/pull/148) ([texodus](https://github.com/texodus))
- Dropdown style [\#147](https://github.com/finos/perspective/pull/147) ([texodus](https://github.com/texodus))
- Bug fixes 2 [\#145](https://github.com/finos/perspective/pull/145) ([texodus](https://github.com/texodus))

## [v0.1.16](https://github.com/finos/perspective/tree/v0.1.16) (2018-07-02)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.15...v0.1.16)

**Merged pull requests:**

- Fixed hypergrid deletion bug. [\#144](https://github.com/finos/perspective/pull/144) ([texodus](https://github.com/texodus))
- Fixed Hypergrid lazy data model scroll performance bug [\#143](https://github.com/finos/perspective/pull/143) ([texodus](https://github.com/texodus))
- Added an example of loading a CSV client side [\#142](https://github.com/finos/perspective/pull/142) ([texodus](https://github.com/texodus))
- Fix event ordering bug when switching visualization types [\#141](https://github.com/finos/perspective/pull/141) ([texodus](https://github.com/texodus))
- Smart column selection when switching visualization plugin [\#140](https://github.com/finos/perspective/pull/140) ([texodus](https://github.com/texodus))
- Hypergrid3 [\#139](https://github.com/finos/perspective/pull/139) ([texodus](https://github.com/texodus))
- New labels [\#137](https://github.com/finos/perspective/pull/137) ([texodus](https://github.com/texodus))
- Fixed IE regressions [\#134](https://github.com/finos/perspective/pull/134) ([texodus](https://github.com/texodus))

## [v0.1.15](https://github.com/finos/perspective/tree/v0.1.15) (2018-06-11)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.14...v0.1.15)

**Closed issues:**

- Vertical Layout? [\#128](https://github.com/finos/perspective/issues/128)
- Scatter chart doesn't render when X axis is a string aggregate e.g. unique\(stringColumn\) [\#106](https://github.com/finos/perspective/issues/106)
- Issue in installing on Windows 10 [\#90](https://github.com/finos/perspective/issues/90)
- Add stacked area graph to perspective-viewer-highcharts [\#89](https://github.com/finos/perspective/issues/89)

**Merged pull requests:**

- Fixed datetime category axes [\#133](https://github.com/finos/perspective/pull/133) ([texodus](https://github.com/texodus))
- Cleaned up code, fixed chart offset regression in material theme. [\#132](https://github.com/finos/perspective/pull/132) ([texodus](https://github.com/texodus))
- Multi chart [\#131](https://github.com/finos/perspective/pull/131) ([texodus](https://github.com/texodus))
- Made y\_area charts stacked by default [\#130](https://github.com/finos/perspective/pull/130) ([texodus](https://github.com/texodus))
- Added category axis support to xy\_ charts [\#129](https://github.com/finos/perspective/pull/129) ([texodus](https://github.com/texodus))

## [v0.1.14](https://github.com/finos/perspective/tree/v0.1.14) (2018-06-04)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.13...v0.1.14)

**Closed issues:**

- Allow perspective\_viewer users to subscribe to view updates [\#109](https://github.com/finos/perspective/issues/109)
- The Lerna script cannot find boost when building C++ modules [\#40](https://github.com/finos/perspective/issues/40)
- Autodetection of timestamps? [\#37](https://github.com/finos/perspective/issues/37)

**Merged pull requests:**

- New docs [\#127](https://github.com/finos/perspective/pull/127) ([texodus](https://github.com/texodus))
- Namespaced -viewer events, documented, added view update event. [\#126](https://github.com/finos/perspective/pull/126) ([texodus](https://github.com/texodus))
- Boost mode for line charts [\#125](https://github.com/finos/perspective/pull/125) ([texodus](https://github.com/texodus))
- Ignore boost in perspective cpp [\#124](https://github.com/finos/perspective/pull/124) ([LukeSheard](https://github.com/LukeSheard))
- Fixed scatter bug [\#123](https://github.com/finos/perspective/pull/123) ([texodus](https://github.com/texodus))
- Highcharts refactor [\#122](https://github.com/finos/perspective/pull/122) ([texodus](https://github.com/texodus))
- Adding dark mode via theme [\#121](https://github.com/finos/perspective/pull/121) ([timkpaine](https://github.com/timkpaine))
- Grid styles [\#120](https://github.com/finos/perspective/pull/120) ([texodus](https://github.com/texodus))
- Add `emscripten` docker container [\#114](https://github.com/finos/perspective/pull/114) ([texodus](https://github.com/texodus))

## [v0.1.13](https://github.com/finos/perspective/tree/v0.1.13) (2018-05-22)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.12...v0.1.13)

**Merged pull requests:**

- UI theme support [\#119](https://github.com/finos/perspective/pull/119) ([texodus](https://github.com/texodus))
- Adding template polyfill for browsers that do not support the template tag [\#118](https://github.com/finos/perspective/pull/118) ([neilslinger](https://github.com/neilslinger))

## [v0.1.12](https://github.com/finos/perspective/tree/v0.1.12) (2018-05-18)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.11...v0.1.12)

**Merged pull requests:**

- Fixed hidden column regression [\#117](https://github.com/finos/perspective/pull/117) ([texodus](https://github.com/texodus))

## [v0.1.11](https://github.com/finos/perspective/tree/v0.1.11) (2018-05-18)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.10...v0.1.11)

**Closed issues:**

- Uncaught TypeError: Cannot convert "\[object Object\]" to unsigned int when deleting a table [\#81](https://github.com/finos/perspective/issues/81)

**Merged pull requests:**

- Re-added remove\(\) feature from bad merge [\#116](https://github.com/finos/perspective/pull/116) ([texodus](https://github.com/texodus))
- Added tests to verify deletions cause no errors [\#115](https://github.com/finos/perspective/pull/115) ([texodus](https://github.com/texodus))
- Fixed heatmap legend direction [\#113](https://github.com/finos/perspective/pull/113) ([texodus](https://github.com/texodus))

## [v0.1.10](https://github.com/finos/perspective/tree/v0.1.10) (2018-05-17)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.9...v0.1.10)

**Closed issues:**

- Node version seems to be broken [\#101](https://github.com/finos/perspective/issues/101)
- Support for 'delete' row operation [\#56](https://github.com/finos/perspective/issues/56)

**Merged pull requests:**

- Sunburst charts [\#112](https://github.com/finos/perspective/pull/112) ([texodus](https://github.com/texodus))
- Added 'remove' command to perspective.table [\#111](https://github.com/finos/perspective/pull/111) ([texodus](https://github.com/texodus))
- Support for initializing with schema [\#110](https://github.com/finos/perspective/pull/110) ([timkpaine](https://github.com/timkpaine))
- Sort order [\#107](https://github.com/finos/perspective/pull/107) ([texodus](https://github.com/texodus))
- Custom element decorators [\#105](https://github.com/finos/perspective/pull/105) ([texodus](https://github.com/texodus))
- Allow empty strings in arrow columns  \(as disctinct from null values\) [\#103](https://github.com/finos/perspective/pull/103) ([nmichaud](https://github.com/nmichaud))
- Bug fixes 0.1.9 [\#102](https://github.com/finos/perspective/pull/102) ([texodus](https://github.com/texodus))

## [v0.1.9](https://github.com/finos/perspective/tree/v0.1.9) (2018-04-24)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.8...v0.1.9)

**Closed issues:**

- add documentation on how to use filter [\#66](https://github.com/finos/perspective/issues/66)

**Merged pull requests:**

- Fixed -examples modules [\#98](https://github.com/finos/perspective/pull/98) ([texodus](https://github.com/texodus))
- Rebuild [\#97](https://github.com/finos/perspective/pull/97) ([texodus](https://github.com/texodus))
- Removed perspective-common module [\#96](https://github.com/finos/perspective/pull/96) ([texodus](https://github.com/texodus))
- Custom elements v1 [\#95](https://github.com/finos/perspective/pull/95) ([texodus](https://github.com/texodus))
- comm is a promise now, upping jlab version, upping package version [\#94](https://github.com/finos/perspective/pull/94) ([timkpaine](https://github.com/timkpaine))
- Date filters [\#93](https://github.com/finos/perspective/pull/93) ([texodus](https://github.com/texodus))

## [v0.1.8](https://github.com/finos/perspective/tree/v0.1.8) (2018-04-16)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.7...v0.1.8)

**Closed issues:**

- filter input fails to filter if filter value is empty string [\#72](https://github.com/finos/perspective/issues/72)
- View='horizontal' and view='vertical' less meaningful than view='scatter' and view='line' [\#36](https://github.com/finos/perspective/issues/36)

**Merged pull requests:**

- New viewer filters [\#92](https://github.com/finos/perspective/pull/92) ([texodus](https://github.com/texodus))
- Highcharts refactor [\#91](https://github.com/finos/perspective/pull/91) ([texodus](https://github.com/texodus))
- Add support for javascript defined custom columns [\#88](https://github.com/finos/perspective/pull/88) ([nmichaud](https://github.com/nmichaud))
- Fixed perspective-viewer load order regression, when a schema is used… [\#87](https://github.com/finos/perspective/pull/87) ([texodus](https://github.com/texodus))

## [v0.1.7](https://github.com/finos/perspective/tree/v0.1.7) (2018-04-05)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.6...v0.1.7)

**Merged pull requests:**

- More highcharts modes [\#86](https://github.com/finos/perspective/pull/86) ([texodus](https://github.com/texodus))

## [v0.1.6](https://github.com/finos/perspective/tree/v0.1.6) (2018-04-03)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.5...v0.1.6)

**Closed issues:**

- Dates become timestamps when pivoting [\#67](https://github.com/finos/perspective/issues/67)

**Merged pull requests:**

- Style fixes. [\#85](https://github.com/finos/perspective/pull/85) ([texodus](https://github.com/texodus))
- Weighted mean API [\#84](https://github.com/finos/perspective/pull/84) ([texodus](https://github.com/texodus))
- Fix setting the aggregate attribute on perspective-viewer [\#83](https://github.com/finos/perspective/pull/83) ([nmichaud](https://github.com/nmichaud))
- Better date formatting for plugins [\#82](https://github.com/finos/perspective/pull/82) ([texodus](https://github.com/texodus))
- Windows 10 installation instructions [\#78](https://github.com/finos/perspective/pull/78) ([msturdikova](https://github.com/msturdikova))

## [v0.1.5](https://github.com/finos/perspective/tree/v0.1.5) (2018-03-30)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.4...v0.1.5)

**Closed issues:**

- Filter: both hypergrid & highcharts fail to render filtered data set that is empty \(0-sided only\) [\#76](https://github.com/finos/perspective/issues/76)
- Support for using a 'table' across multiple perspective-viewers [\#61](https://github.com/finos/perspective/issues/61)
- heads up: Arrow API updates and breaking changes [\#38](https://github.com/finos/perspective/issues/38)
- Requesting for Filipino Translation [\#32](https://github.com/finos/perspective/issues/32)
- JSON structure not always loadable [\#8](https://github.com/finos/perspective/issues/8)
- Deal with wasm files for jlab [\#7](https://github.com/finos/perspective/issues/7)
- Support loading with no data [\#6](https://github.com/finos/perspective/issues/6)

**Merged pull requests:**

- Viewer fixes [\#80](https://github.com/finos/perspective/pull/80) ([texodus](https://github.com/texodus))
- Properly handle case when there is no data [\#77](https://github.com/finos/perspective/pull/77) ([nmichaud](https://github.com/nmichaud))
- Fixed ellipsis to show when column names extend past visible panel. [\#74](https://github.com/finos/perspective/pull/74) ([texodus](https://github.com/texodus))
- Boost mode for Highcharts scatter+heatmaps [\#73](https://github.com/finos/perspective/pull/73) ([texodus](https://github.com/texodus))
- \[WIP\]: update to apache-arrow@0.3.0 [\#55](https://github.com/finos/perspective/pull/55) ([trxcllnt](https://github.com/trxcllnt))

## [v0.1.4](https://github.com/finos/perspective/tree/v0.1.4) (2018-03-12)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.3...v0.1.4)

**Merged pull requests:**

- Various fixes for layout, drag-and-drop [\#69](https://github.com/finos/perspective/pull/69) ([texodus](https://github.com/texodus))
- Reset & more conservative default column selection [\#68](https://github.com/finos/perspective/pull/68) ([texodus](https://github.com/texodus))

## [v0.1.3](https://github.com/finos/perspective/tree/v0.1.3) (2018-03-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.2...v0.1.3)

**Closed issues:**

- ValueError: "@jpmorganchase/perspective-jupyterlab" is not a valid extension [\#53](https://github.com/finos/perspective/issues/53)

**Merged pull requests:**

- Added table and view deletion callbacks [\#64](https://github.com/finos/perspective/pull/64) ([texodus](https://github.com/texodus))
- Remove specification of index column type from API [\#63](https://github.com/finos/perspective/pull/63) ([texodus](https://github.com/texodus))
- Data column fixes [\#62](https://github.com/finos/perspective/pull/62) ([texodus](https://github.com/texodus))
- Scatter labels to show pivot values [\#60](https://github.com/finos/perspective/pull/60) ([nmichaud](https://github.com/nmichaud))
- Adding utility classes to allow direct web socket/socketio/http connections to perspective in jupyterlab [\#59](https://github.com/finos/perspective/pull/59) ([timkpaine](https://github.com/timkpaine))

## [v0.1.2](https://github.com/finos/perspective/tree/v0.1.2) (2018-02-26)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.1...v0.1.2)

**Closed issues:**

- Errors with IE11, in hypergrid [\#27](https://github.com/finos/perspective/issues/27)
- Issue with encoding: Getting Error: String has UTF-16 code units that do not fit in 8 bits [\#14](https://github.com/finos/perspective/issues/14)
- Stuck in loading on mobile [\#12](https://github.com/finos/perspective/issues/12)

**Merged pull requests:**

- Bug Fixes [\#58](https://github.com/finos/perspective/pull/58) ([texodus](https://github.com/texodus))
- Various bug fixes. [\#57](https://github.com/finos/perspective/pull/57) ([texodus](https://github.com/texodus))
- Support Dict arrays with Binary vectors [\#54](https://github.com/finos/perspective/pull/54) ([nmichaud](https://github.com/nmichaud))
- change mime renderer type to not interfere with saving notebook [\#52](https://github.com/finos/perspective/pull/52) ([timkpaine](https://github.com/timkpaine))
- Bug fixes for perspective-viewer. [\#50](https://github.com/finos/perspective/pull/50) ([texodus](https://github.com/texodus))
- Copy arrow dictionary directly [\#49](https://github.com/finos/perspective/pull/49) ([texodus](https://github.com/texodus))
- Script fixes [\#48](https://github.com/finos/perspective/pull/48) ([texodus](https://github.com/texodus))
- Add test file for internal apis [\#47](https://github.com/finos/perspective/pull/47) ([nmichaud](https://github.com/nmichaud))
- Heatmap implementation for perspective-viewer-highcharts plugin [\#46](https://github.com/finos/perspective/pull/46) ([texodus](https://github.com/texodus))
- Test for various arrow timestamp resolutions, and proper psp column types [\#45](https://github.com/finos/perspective/pull/45) ([nmichaud](https://github.com/nmichaud))
- Update API to use transferable when available [\#44](https://github.com/finos/perspective/pull/44) ([nmichaud](https://github.com/nmichaud))
- Refactored Highcharts imports to use heatmap module from base package. [\#43](https://github.com/finos/perspective/pull/43) ([texodus](https://github.com/texodus))
- Add transferable support for binary arrow files [\#42](https://github.com/finos/perspective/pull/42) ([nmichaud](https://github.com/nmichaud))
- Support ns and us time resolutions [\#41](https://github.com/finos/perspective/pull/41) ([nmichaud](https://github.com/nmichaud))
- Actually the port number is 8080 NOT 8081 [\#39](https://github.com/finos/perspective/pull/39) ([Passw](https://github.com/Passw))
- removing lantern dependency [\#34](https://github.com/finos/perspective/pull/34) ([timkpaine](https://github.com/timkpaine))
- Add link for "emsdk" installation. [\#31](https://github.com/finos/perspective/pull/31) ([loicbourgois](https://github.com/loicbourgois))
- Remove seemingly unnecessary install step in README.md [\#30](https://github.com/finos/perspective/pull/30) ([loicbourgois](https://github.com/loicbourgois))
- Fixes \#14: Fixing issue with encoding, data only [\#29](https://github.com/finos/perspective/pull/29) ([msturdikova](https://github.com/msturdikova))
- Fixes ScriptPath for script paths with query strings [\#28](https://github.com/finos/perspective/pull/28) ([shaunol](https://github.com/shaunol))
- spelling fix, no content changes [\#26](https://github.com/finos/perspective/pull/26) ([paralax](https://github.com/paralax))
- README missing hyphen [\#25](https://github.com/finos/perspective/pull/25) ([reviewher](https://github.com/reviewher))
- Support binary type \(for non-unicode string data\) [\#24](https://github.com/finos/perspective/pull/24) ([nmichaud](https://github.com/nmichaud))
- bugfix for jupyter compat [\#23](https://github.com/finos/perspective/pull/23) ([timkpaine](https://github.com/timkpaine))

## [v0.1.1](https://github.com/finos/perspective/tree/v0.1.1) (2018-02-05)

[Full Changelog](https://github.com/finos/perspective/compare/v0.1.0...v0.1.1)

**Merged pull requests:**

- Arrow improvements [\#22](https://github.com/finos/perspective/pull/22) ([nmichaud](https://github.com/nmichaud))
- Firefox doesn't support 'new Date\("date string"\)' for arbitrary date … [\#20](https://github.com/finos/perspective/pull/20) ([nmichaud](https://github.com/nmichaud))
- Internal cleanup of gnode/pool api [\#19](https://github.com/finos/perspective/pull/19) ([nmichaud](https://github.com/nmichaud))
- Refactor pkey/op creation for tables [\#18](https://github.com/finos/perspective/pull/18) ([nmichaud](https://github.com/nmichaud))
- JupyterLab extension for perspective rendering [\#17](https://github.com/finos/perspective/pull/17) ([timkpaine](https://github.com/timkpaine))

## [v0.1.0](https://github.com/finos/perspective/tree/v0.1.0) (2018-01-31)

[Full Changelog](https://github.com/finos/perspective/compare/v0.0.2...v0.1.0)

**Merged pull requests:**

- Column-only pivoting. [\#15](https://github.com/finos/perspective/pull/15) ([texodus](https://github.com/texodus))
- Initial support for loading Apache Arrow data [\#11](https://github.com/finos/perspective/pull/11) ([nmichaud](https://github.com/nmichaud))
- Don't rely on internal embind implementation for the type of context … [\#10](https://github.com/finos/perspective/pull/10) ([nmichaud](https://github.com/nmichaud))
- Column chooser [\#9](https://github.com/finos/perspective/pull/9) ([texodus](https://github.com/texodus))

## [v0.0.2](https://github.com/finos/perspective/tree/v0.0.2) (2018-01-08)

[Full Changelog](https://github.com/finos/perspective/compare/v0.0.1...v0.0.2)

**Merged pull requests:**

- Lazy hypergrid [\#5](https://github.com/finos/perspective/pull/5) ([texodus](https://github.com/texodus))
- Incremental Hypergrid loading;  viewer transform updates no longer stack. [\#4](https://github.com/finos/perspective/pull/4) ([texodus](https://github.com/texodus))

## [v0.0.1](https://github.com/finos/perspective/tree/v0.0.1) (2018-01-01)

[Full Changelog](https://github.com/finos/perspective/compare/617dc2213131f78eb6e09221a6d3e3a84b333432...v0.0.1)

**Merged pull requests:**

- Better tests [\#3](https://github.com/finos/perspective/pull/3) ([texodus](https://github.com/texodus))
- Jest [\#2](https://github.com/finos/perspective/pull/2) ([texodus](https://github.com/texodus))
- README corrections [\#1](https://github.com/finos/perspective/pull/1) ([neilslinger](https://github.com/neilslinger))



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
