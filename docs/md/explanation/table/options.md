## Index and Limit

<div class="warning">`limit` cannot be used in conjunction with `index`.</div>

Initializing a `Table` with an `index` tells Perspective to treat a column as
the primary key, allowing in-place updates of rows. Only a single column (of any
type) can be used as an `index`. Indexed `Table` instances allow:

-   In-place _updates_ whenever a new row shares an `index` values with an
    existing row
-   _Partial updates_ when a data batch omits some column.
-   _Removes_ to delete a row by `index`.

To create an indexed `Table`, provide the `index` property with a string column
name to be used as an index:

<div class="javascript">

JavaScript:

```javascript
const indexed_table = await perspective.table(data, { index: "a" });
```

</div>
<div class="python">

Python

```python
indexed_table = perspective.Table(data, index="a");
```

</div>

Initializing a `Table` with a `limit` sets the total number of rows the `Table`
is allowed to have. When the `Table` is updated, and the resulting size of the
`Table` would exceed its `limit`, rows that exceed `limit` overwrite the oldest
rows in the `Table`. To create a `Table` with a `limit`, provide the `limit`
property with an integer indicating the maximum rows:

<div class="javascript">

JavaScript:

```javascript
const limit_table = await perspective.table(data, { limit: 1000 });
```

</div>
<div class="python">

Python:

```python
limit_table = perspective.Table(data, limit=1000);
```

</div>
