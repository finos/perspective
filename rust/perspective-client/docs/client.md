An instance of a [`Client`] is a unique connection to a single
`perspective_server::Server`, whether locally in-memory or remote over some
transport like a WebSocket.

<div class="javascript">

The browser and node.js libraries both support the `websocket(url)` constructor,
which connects to a remote `perspective_server::Server` instance over a
WebSocket transport.

In the browser, the `worker()` constructor creates a new Web Worker
`perspective_server::Server` and returns a [`Client`] connected to it.

In node.js, a pre-instantied [`Client`] connected synhronously to a global
singleton `perspective_server::Server` is the default module export.

# JavaScript Examples

Create a Web Worker `perspective_server::Server` in the browser and return a
[`Client`] instance connected for it:

```javascript
import perspective from "@finos/perspective";
const client = await perspective.worker();
```

Create a WebSocket connection to a remote `perspective_server::Server`:

```javascript
import perspective from "@finos/perspective";
const client = await perspective.websocket("ws://locahost:8080/ws");
```

Access the synchronous client in node.js:

```javascript
import { default as client } from "@finos/perspective";
```

</div>
<div class="python">

# Python Examples

Create a `perspective_server::Server` and a local, synchronous [`Client`]
instance connected for it:

```python
import perspective;
server = perspective.Server()
client = server.new_local_client();
```

</div>
<div class="rust">

# Examples

Create a `perspective_server::Server` and a synchronous [`Client`] via the
`perspective` crate:

```rust
use perspective::server::Server;
use perspective::LocalClient;

let server = Server::default();
let client = perspective::LocalClient::new(&server);
```

</div>
