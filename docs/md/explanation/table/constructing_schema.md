# Construct a Table

Examples of constructing an empty `Table` from a schema.

<div class="javascript">

JavaScript:

```javascript
var schema = {
    x: "integer",
    y: "string",
    z: "boolean",
};

const table2 = await worker.table(schema);
```

</div>
<div class="python">

Python:

```python
from datetime import date, datetime

schema = {
    "x": "integer",
    "y": "string",
    "z": "boolean",
}

table2 = perspective.table(schema)
```

</div>
<div class="rust">

Rust:

```rust
let data = TableData::Schema(vec![(" a".to_string(), ColumnType::FLOAT)]);
let options = TableInitOptions::default();
let table = client.table(data.into(), options).await?;
```

</div>
