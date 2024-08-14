Provides the [`SystemInfo`] struct, implementation-specific metadata about the
`perspective_server::Server` runtime such as Memory and CPU usage.

<div class="javascript">

For WebAssembly servers, this method includes the WebAssembly heap size.

# JavaScript Examples

```javascript
const info = await client.system_info();
```

</div>
