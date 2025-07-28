# Multi-threading

Perspective's API is thread-safe, so methods may be called from different
threads without additional consideration for safety/exclusivity/correctness. All
`perspective.Client` and `perspective.Server` API methods release the GIL, which
can be exploited for parallelism.

Interally, `perspective.Server` also dispatches to a thread pool for some
operations, enabling better parallelism and overall better query performance.
This independent threadpool size can be controlled via
`perspective.set_num_cpus()`, or the `OMP_NUM_THREADS` environment variable.

```python
import perspective

perspective.set_num_cpus(2)
```

## Server handlers

Perspective's server handler implementations each take an optional `executor`
constructor argument, which (when provided) will configure the handler to
process WebSocket `Client` requests on a thread pool.

```python
from concurrent.futures import ThreadPoolExecutor
from tornado.web import Application
from perspective.handlers.tornado import PerspectiveTornadoHandler
from perspective import Server

args = {"perspective_server": Server(), "executor": ThreadPoolExecutor()}

app = Application(
    [
        (r"/websocket", PerspectiveTornadoHandler, args),

        # ...

    ]
)
```

## `on_poll_request`

`on_poll_request` is an optional keyword argument for `Server()`, which which
can be applied in cases where overlapping `Table.update` calls can be safely
deferred.

When providing a callback function to `on_poll_request`, the `Server` will
invoke your callback when there are updates that need to be flushed, after which
you must _eventually_ call `Server.poll` (or else no updates will be processed).

The exact implementation of `on_poll_request` will depend on the context. A
simple example which batches calls via `threading.Lock`:

```python
lock = threading.Lock()

def on_poll_request(perspective_server):
    if lock.acquire(blocking=False):
        try:
            perspective_server.poll()
        finally:
            lock.release()

server = Server(on_poll_request=on_poll_request)
```
