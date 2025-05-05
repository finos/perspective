# React Component

We provide a React wrapper to prevent common issues and mistakes associated with
using the perspective-viewer web component in the context of React.

Before trying this example, please take a look at
[how to bootstrap perspective](./importing.md).

A simple example:

```typescript
{{#include ../../../../examples/react-example/src/index.tsx:63:}}
```

This adds a perspective table to the provider at the root of the app and allows
us to create viewers referencing those tables anywhere within that context. Any
views or viewers associated with the React component are automatically cleaned
up as part of the lifecycle of the component, but tables are still the
responsibility of the caller to cleanup currently.
