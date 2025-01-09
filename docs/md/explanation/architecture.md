# Data Architecture

Application developers can choose from
[Client (WebAssembly)](./architecture/client_only.md),
[Server (Python/Node)](./architecture/server_only.md) or
[Client/Server Replicated](./architecture/client_server.md) designs to bind
data, and a web application can use one or a mix of these designs as needed. By
serializing to Apache Arrow, tables are duplicated and synchronized across
runtimes efficiently.

Perspective is a multi-language platform. The examples in this section use
Python and JavaScript as an example, but the same general principles apply to
any `Client`/`Server` combination.

<img src="./architecture/architecture.svg" />
