The JavaScript language bindings for
[Perspective](https://perspective.finos.org).

# JavaScript Examples

A simple example which loads an [Apache Arrow](https://arrow.apache.org/) and
computes a "Group By" operation, returning a new Arrow.

```javascript
import perspective from "@finos/perspective";

const table = await perspective.table(apache_arrow_data);
const view = await table.view({ group_by: ["CounterParty", "Security"] });
const arrow = await view.to_arrow();
```
