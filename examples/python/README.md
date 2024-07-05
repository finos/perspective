# python

This example contains various simple `perspective-python`-based webservers serve datasets to the user through various [data bindings](https://perspective.finos.org/docs/md/server.html):

- `index.html`: a [client/server replicated](https://perspective.finos.org/docs/md/server.html#clientserver-replicated) setup that synchronizes the client and server data using Apache Arrow.
- `server_mode.html`: a [server-only](https://perspective.finos.org/docs/md/server.html#server-only) setup that reads data and performs operations directly on the server using commands sent through the Websocket.
- `client_server_editing`: a client-server replicated setup that also enables editing, where edits from multiple clients are applied properly to the server, and then synchronized back to the clients.
