# Multi-threading

Perspective's API is thread-safe (safe to call from multiple threads
concurrently),

Perspective's server API releases the GIL when called (though it may be retained
for some portion of the `Client` call to encode RPC messages). It also
dispatches to an internal thread pool for some operations, enabling better
parallelism and overall better server performance. However, Perspective's Python
interface itself will still process queries in a single queue. To enable
parallel query processing, call `set_loop_callback` with a multi-threaded
executor such as `concurrent.futures.ThreadPoolExecutor`:

```python
def perspective_thread():
    server = perspective.Server()
    loop = tornado.ioloop.IOLoop()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        server.set_loop_callback(loop.run_in_executor, executor)
        loop.start()
```
