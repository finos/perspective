# Remote Example

An example of connecting a server-side perspective in node.js to a client-side
perspective running in a WebWorker.  Both "State of the World" and subsequent
update data are transferred via Arrow-encoded ArrayBuffers over WebSocket.