# Client-only

<img src="./architecture.sub1.svg" />

_For static datasets, datasets provided by the user, and simple server-less and
read-only web applications._

In this design, Perspective is run as a client Browser WebAssembly library, the
dataset is downloaded entirely to the client and all calculations and UI
interactions are performed locally. Interactive performance is very good, using
WebAssembly engine for near-native runtime plus WebWorker isolation for parallel
rendering within the browser. Operations like scrolling and creating new views
are responsive. However, the entire dataset must be downloaded to the client.
Perspective is not a typical browser component, and datset sizes of 1gb+ in
Apache Arrow format will load fine with good interactive performance!

Horizontal scaling is a non-issue, since here is no concurrent state to scale,
and only uses client-side computation via WebAssembly client. Client-only
perspective can support as many concurrent users as can download the web
application itself. Once the data is loaded, no server connection is needed and
all operations occur in the client browser, imparting no additional runtime cost
on the server beyond initial load. This also means updates and edits are local
to the browser client and will be lost when the page is refreshed, unless
otherwise persisted by your application.

As the client-only design starts with creating a client-side Perspective
`Table`, data can be provided by any standard web service in any Perspective
compatible format (JSON, CSV or Apache Arrow).

#### Javascript client

```javascript
const worker = await perspective.worker();
const table = await worker.table(csv);

const viewer = document.createElement("perspective-viewer");
document.body.appendChild(viewer);
await viewer.load(table);
```
