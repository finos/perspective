An instance of a `Client` is a unique connection to a single `Server`, whether
locally in-memory or remote over some transport like a `WebSocket`. To create,
use the appropriate constructor function:

-   `websocket` - Create a connection to a WebSocket `Server` instance.
-   `worker` (JavaScript) - Unlike the other `Client` constructors, the
    `worker` version also owns its `Server`, which runs in a dedicated Web
    Worker.
-   `local` [Rust, Python] - Create an `Client` connected to an in-memory,
    in-process `Server`.

# Examples

#### JavaScript

```javascript
const client = await perspective.worker();
```
