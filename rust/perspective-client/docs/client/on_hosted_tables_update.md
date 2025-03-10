Register a callback which is invoked whenever `Client::table` (on this `Client`)
or `Table::delete` (on a `Table` belinging to this `Client`) are called.

<div class="javascript">

# JavaScript Examples

```javascript
const sub = await client.on_hosted_tables_update(() => {
    console.log("Tables have updated!", await client.get_hosted_table_names());
});

// This invokes the handler
const table = await client.table("x\n1", {name: "test"});

// So does this
await table.delete();

// cleanup
await client.remove_hosted_tables_update(sub);
```

</div>
<div class="python">

</div>
<div class="python">

</div>
