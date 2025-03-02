# Using a custom WebWorker

The `Client.worker` constructor by default creates a dedicated `Worker` bound to
the page context. Alternatively, `Client.worker` can take a `Worker`,
`SharedWorker` or `ServiceWorker` instance as a first argument, which load the
worker script disted at
`"@finos/perspective/dist/cdn/perspective-server.worker.js"`.

<span class="warning">`SharedWorker` and `ServiceWorker` have more complicated
behavior compared to a dedicated `Worker`, and will need special consideration
to integrate (or debug).</span>

## Dedicated `Worker`

```javascript
const worker = await perspective.worker(new Worker(url));
```

## `SharedWorker`

```javascript
const worker = await perspective.worker(new SharedWorker(url));
```

## `ServiceWorker`

```javascript
const registration = await navigator.serviceWorker.register(url, {
    scope: "", // Your scope here
});

const worker = await perspective.worker(registration.active);
```
