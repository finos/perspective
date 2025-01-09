# Loading data

A `Table` may also be created-or-updated by data in CSV,
[Apache Arrow](https://arrow.apache.org/), JSON row-oriented or JSON
column-oriented formats. In addition to these, `perspective-python` additionally
supports `pyarrow.Table`, `polars.DataFrame` and `pandas.DataFrame` objects
directly. These formats are otherwise identical to the built-in formats and
don't exhibit any additional support or type-awareness; e.g., `pandas.DataFrame`
support is _just_ `pyarrow.Table.from_pandas` piped into Perspective's Arrow
reader.

`Client::table` and `Table::update` perform _coercion_ on their input for all
input formats _except_ Arrow (which comes with its own schema and has no need
for coercion). `"date"` and `"datetime"` column types do not have native JSON
representations, so these column types _cannot_ be inferred from JSON input.
Instead, for columns of these types for JSON input, a `Table` must first be
constructed with a _schema_. Next, call `Table::update` with the JSON input -
Perspective's JSON reader may _coerce_ a `date` or `datetime` from these native
JSON types:

-   `integer` as milliseconds-since-epoch.
-   `string` as a any of Perspective's built-in date format formats.
-   JavaScript `Date` and Python `datetime.date` and `datetime.datetime` are
    _not_ supported directly. However, in JavaScript `Date` types are
    automatically coerced to correct `integer` timestamps by default when
    converted to JSON.

## Apache Arrow

The most efficient way to load data into Perspective, encoded as
[Apache Arrow IPC format](https://arrow.apache.org/docs/python/ipc.html). In
JavaScript:

```javascript
const resp = await fetch(
    "https://cdn.jsdelivr.net/npm/superstore-arrow/superstore.lz4.arrow"
);

const arrow = await resp.arrayBuffer();
```

Apache Arrow input do not support type coercion, preferring Arrow's internal
self-describing schema.

## CSV

Perspective relies on Apache Arrow's CSV parser, and as such uses mostly the
same column-type inference logic as Arrow itself would use for parsing CSV.

## Row Oriented JSON

Row-oriented JSON is in the form of a list of objects. Each object in the list
corresponds to a row in the table. For example:

```json
[
    { "a": 86, "b": false, "c": "words" },
    { "a": 0, "b": true, "c": "" },
    { "a": 12345, "b": false, "c": "here" }
]
```

## Column Oriented JSON

Column-Oriented JSON comes in the form of an object of lists. Each key of the
object is a column name, and each element of the list is the corresponding value
in the row.

```json
{
    "a": [86, 0, 12345],
    "b": [false, true, false],
    "c": ["words", "", "here"]
}
```

## NDJSON

[NDJSON](https://github.com/ndjson/ndjson-spec) is a format.

```json
{ "a": 86, "b": false, "c": "words" }
{ "a": 0, "b": true, "c": "" }
{ "a": 12345, "b": false, "c": "here" }
```
