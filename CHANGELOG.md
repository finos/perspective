# Changelog

## [0.6.0](https://github.com/finos/perspective/tree/HEAD)

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



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
