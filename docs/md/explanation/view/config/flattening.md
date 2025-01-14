# Flattening a [`Table::view`] into a [`Table`]

In Javascript, a [`Table`] can be constructed on a [`Table::view`] instance,
which will return a new [`Table`] based on the [`Table::view`]'s dataset, and
all future updates that affect the [`Table::view`] will be forwarded to the new
[`Table`]. This is particularly useful for implementing a
[Client/Server Replicated](server.md#clientserver-replicated) design, by
serializing the `View` to an arrow and setting up an `on_update` callback.

<div class="javascript">

```javascript
const worker1 = perspective.worker();
const table = await worker.table(data);
const view = await table.view({ filter: [["State", "==", "Texas"]] });
const table2 = await worker.table(view);
table.update([{ State: "Texas", City: "Austin" }]);
```

</div>
<div class="python">

```python
table = perspective.Table(data);
view = table.view(filter=[["State", "==", "Texas"]])
table2 = perspective.Table(view.to_arrow());

def updater(port, delta):
    table2.update(delta)

view.on_update(updater, mode="Row")
table.update([{"State": "Texas", "City": "Austin"}])
```

</div>
<div class="rust">

```rust
let opts = TableInitOptions::default();
let data = TableData::Update(UpdateData::Csv("x,y\n1,2\n3,4".into()));
let table = client.table(data, opts).await?;
let view = table.view(None).await?;
let table2 = client.table(TableData::View(view)).await?;
table.update(data).await?;
```

</div>
