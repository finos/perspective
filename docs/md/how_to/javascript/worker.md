# Accessing the Perspective engine via a `Client` instance

An instance of a `Client` is needed to talk to a Perspective `Server`, of which
there are a few varieties available in JavaScript.

## Web Worker (Browser)

Perspective's Web Worker client is actually a `Client` and `Server` rolled into
one. Instantiating this `Client` will also create a _dedicated_ Perspective
`Server` in a Web Worker process.

To use it, you'll need to instantiate a Web Worker `perspective` engine via the
`worker()` method. This will create a new Web Worker (browser) and load the
WebAssembly binary. All calculation and data accumulation will occur in this
separate process.

```javascript
const client = await perspective.worker();
```

The `worker` symbol will expose the full `perspective` API for one managed Web
Worker process. You are free to create as many as your browser supports, but be
sure to keep track of the `worker` instances themselves, as you'll need them to
interact with your data in each instance.

## Websocket (Browser)

Alternatively, with a Perspective server running in Node.js, Python or Rust, you
can create a _virtual_ `Client` via the `websocket()` method.

```javascript
const client = perspective.websocket("http://localhost:8080/");
```

## Node.js

The Node.js runtime for the `@finos/perspective` module runs in-process by
default and does not implement a `child_process` interface, so no need to call
the `.worker()` factory function. Instead, the `perspective` library exports the
functions directly and run synchronously in the main process.

```javascript
const client = require("@finos/perspective");
```
