Creates a new [`Table`] from either a _schema_ or _data_.

The [`Client::table`] factory function can be initialized with either a _schema_
(see [`Table::schema`]), or data in one of these formats:

-   Apache Arrow
-   CSV
-   JSON row-oriented
-   JSON column-oriented

When instantiated with _data_, the schema is inferred from this data. While this
is convenient, inferrence is sometimes imperfect e.g. when the input is empty,
null or ambiguous. For these cases, [`Client::table`] can first be instantiated
with a explicit schema.

When instantiated with a _schema_, the resulting [`Table`] is empty but with
known column names and column types. When subsqeuently populated with
[`Table::update`], these columns will be _coerced_ to the schema's type. This
behavior can be useful when [`Client::table`]'s column type inferences doesn't
work.

The resulting [`Table`] is _virtual_, and invoking its methods dispatches events
to the `perspective_server::Server` this [`Client`] connects to, where the data
is stored and all calculation occurs.

# Arguments

-   `arg` - Either _schema_ or initialization _data_.
-   `options` - Optional configuration which provides one of:
    -   `limit` - The max number of rows the resulting [`Table`] can store.
    -   `index` - The column name to use as an _index_ column. If this `Table`
        is being instantiated by _data_, this column name must be present in the
        data.
    -   `name` - The name of the table. This will be generated if it is not
        provided.

<div class="javascript">

# JavaScript Examples

Load a CSV from a `string`:

```javascript
const table = await client.table("x,y\n1,2\n3,4");
```

Load an Arrow from an `ArrayBuffer`:

```javascript
import * as fs from "node:fs/promises";
const table2 = await client.table(await fs.readFile("superstore.arrow"));
```

Create a table with an `index`:

```javascript
const table = await client.table(data, { index: "Row ID" });
```

</div>
<div class="python">

# Python Examples

Load a CSV from a `str`:

```python
table = client.table("x,y\n1,2\n3,4")
```

</div>
<div class="rust">

# Examples

Load a CSV from a `String`:

```rust
let opts = TableInitOptions::default();
let data = TableData::Update(UpdateData::Csv("x,y\n1,2\n3,4".into()));
let table = client.table(data, opts).await?;
```

</div>
