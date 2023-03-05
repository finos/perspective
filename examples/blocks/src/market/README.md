
A simple market simulation implemented in Perspective, designed to be simple
rather than accurate. The simulation proceeds in steps:

1) Insert a batch of random orders in a range around the market's bid/ask
   spread. For each side of the order book, we can calculate the best open price
   by querying the orders `Table` using the `"max"` or `"min"` aggregates
   (respectively).

```json
{
    columns: ["price"],
    group_by: ["security"],
    aggregates: { price: "max" },
    filter: [
        ["side", "==", "buy"],
        ["status", "==", "open"],
    ],
}
```

1) Clear any matched orders in the `Table`.  To match orders, we fetch all open
   orders on both sides which are outside of the best price, then update an
   _equal_ number of both `"buy"` and `"sell"` side orders to `"closed"`.  The
   `sort` field guarantees that orders are closed in best, then oldest, order.

```json
{
    columns: ["id"],
    filter: [
        ["side", "==", "buy"],
        ["status", "==", "open"],
        ["price", ">", price],
    ],
    sort: [
        ["price", "desc"],
        ["timestamp", "asc"],
    ],
}
```

3) Expire any elapsed orders which are still `"open"` by fetching orders older
   than the expiration ID and update thair status' to `"expired"`.

```json
{
    columns: ["id"],
    filter: [
        ["status", "==", "open"],
        ["id", "<", 12345],
    ],
}
```

4) Sleep for a bit and repeat (1).
