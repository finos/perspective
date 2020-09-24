import {Client} from "./api/client.js";
import {Server} from "./api/server.js";

// Initiate a `ping` to the server every 30 seconds
const PING_TIMEOUT = 30000;
let CLIENT_ID_GEN = 0;

export class WebSocketClient extends Client {
    constructor(ws) {
        super();
        this._ws = ws;
        this._ws.binaryType = "arraybuffer";
        this._ws.onopen = () => {
            this.send({id: -1, cmd: "init"});
        };
        const ping = () => {
            this._ws.send("ping");
            setTimeout(ping, PING_TIMEOUT);
        };
        setTimeout(ping, PING_TIMEOUT);
        this._ws.onmessage = msg => {
            if (msg.data === "pong") {
                return;
            }
            if (this._pending_arrow) {
                let result = {
                    data: {
                        id: this._pending_arrow,
                        data: msg.data
                    }
                };

                // make sure on_update callbacks are called with a `port_id`
                // AND the transferred arrow.
                if (this._pending_port_id !== undefined) {
                    const new_data_with_port_id = {
                        port_id: this._pending_port_id,
                        delta: msg.data
                    };
                    result.data.data = new_data_with_port_id;
                }
                this._handle(result);
                delete this._pending_port_id;
                delete this._pending_arrow;
            } else {
                msg = JSON.parse(msg.data);

                // If the `is_transferable` flag is set, the worker expects the
                // next message to be a transferable object. This sets the
                // `_pending_arrow` flag, which triggers a special handler for
                // the ArrayBuffer containing arrow data.
                if (msg.is_transferable) {
                    this._pending_arrow = msg.id;

                    // Check whether the message also contains a `port_id`,
                    // indicating that we are in an `on_update` callback and
                    // the pending arrow needs to be joined with the port_id
                    // for on_update handlers to work properly.
                    if (msg.data && msg.data.port_id !== undefined) {
                        this._pending_port_id = msg.data.port_id;
                    }
                } else {
                    this._handle({data: msg});
                }
            }
        };
    }

    /**
     * Send a message to the remote, checking whether the arguments contain an
     * ArrayBuffer.
     *
     * @param {Object} msg a message to send to the remote. If the `args`
     * param contains an ArrayBuffer, two messages will be sent - a pre-message
     * with the `is_transferable` flag set to true, and a second message
     * containing the ArrayBuffer. This allows for transport of metadata
     * alongside an ArrayBuffer, and the pattern should be implemented by the
     * receiver.
     */
    send(msg) {
        if (msg.args && msg.args.length > 0 && msg.args[0] instanceof ArrayBuffer && msg.args[0].byteLength !== undefined) {
            const pre_msg = msg;
            msg.is_transferable = true;
            this._ws.send(JSON.stringify(pre_msg));
            this._ws.send(msg.args[0]);
            return;
        }
        this._ws.send(JSON.stringify(msg));
    }

    terminate() {
        return new Promise(resolve => {
            this._ws.onclose = resolve;
            this._ws.close();
        });
    }
}

/**
 * A WebSocket Manager instance for a remote perspective
 */
export class WebSocketManager extends Server {
    constructor(...args) {
        super(...args);
        this.requests_id_map = new Map();
        this.requests = {};
        this.websockets = {};

        // clear invalid connections
        setInterval(() => {
            Object.entries(this.websockets).forEach(([id, ws]) => {
                if (ws.isAlive === false) {
                    delete this.websockets[id];
                    return ws.terminate();
                }
                ws.isAlive = false;
            });
        }, 30000);
    }

    /**
     * Add a new websocket connection to the manager, and define a handler
     * for all incoming messages. If the incoming message has `is_transferable`
     * set, handle incoming `ArrayBuffers` correctly.
     *
     * The WebsocketManager manages the websocket connection and processes every
     * message received from each connections. When a websocket connection is
     * `closed`, the websocket manager will clear all subscriptions associated
     * with the connection.
     *
     * @param {WebSocket} ws a websocket connection
     */
    add_connection(ws) {
        ws.isAlive = true;
        ws.binaryType = "arraybuffer";
        ws.id = CLIENT_ID_GEN++;

        // Parse incoming messages
        ws.on("message", msg => {
            ws.isAlive = true;

            if (msg === "ping") {
                ws.send("pong");
                return;
            }

            if (this._is_transferable) {
                // Combine ArrayBuffer and previous message so that metadata can
                // be reconstituted.
                const buffer = msg;
                let new_args = [buffer];
                msg = this._is_transferable_pre_message;

                if (msg.args && msg.args.length > 1) {
                    new_args = new_args.concat(msg.args.slice(1));
                }

                msg.args = new_args;
                delete msg.is_transferable;

                this._is_transferable = false;
                this._is_transferable_pre_message = undefined;
            } else {
                msg = JSON.parse(msg);

                if (msg.is_transferable) {
                    this._is_transferable = true;
                    this._is_transferable_pre_message = msg;
                    return;
                }
            }

            try {
                // Send all messages to the handler defined in
                // Perspective.Server
                const compoundId = `${msg.id}/${ws.id}`;
                this.requests_id_map.set(compoundId, msg.id);
                msg.id = compoundId;
                this.requests[msg.id] = {ws, msg};
                this.process(msg, ws.id);
            } catch (e) {
                console.error(e);
            }
        });
        ws.on("close", () => {
            this.clear_views(ws.id);
        });
        ws.on("error", console.error);
    }

    /**
     * Send an asynchronous message to the Perspective web worker.
     *
     * If the `transferable` param is set, pass two messages: the string
     * representation of the message and then the ArrayBuffer data that needs to
     * be transferred. The `is_transferable` flag tells the client to expect the
     * next message to be a transferable object.
     *
     * @param {Object} msg a valid JSON-serializable message to pass to the
     * client
     * @param {*} transferable a transferable object to be sent to the client
     */
    post(msg, transferable) {
        const req = this.requests[msg.id];
        const id = msg.id;
        if (req.ws.readyState > 1) {
            delete this.requests[id];
            throw new Error("Connection closed");
        }
        msg.id = this.requests_id_map.get(id);
        if (transferable) {
            msg.is_transferable = true;
            req.ws.send(JSON.stringify(msg));
            req.ws.send(transferable[0]);
        } else {
            req.ws.send(JSON.stringify(msg));
        }
        if (!req.msg.subscribe) {
            this.requests_id_map.delete(id);
            delete this.requests[id];
        }
    }

    _host(cache, name, input) {
        if (cache[name] !== undefined) {
            throw new Error(`"${name}" already exists`);
        }
        input.on_delete(() => {
            delete cache[name];
        });
        cache[name] = input;
    }

    /**
     * Expose a Perspective `table` through the WebSocket, allowing
     * it to be accessed by a unique name from a client.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     * @param {perspective.table} table `table` to host.
     */
    host_table(name, table) {
        this._host(this._tables, name, table);
    }

    /**
     * Expose a Perspective `view` through the WebSocket, allowing
     * it to be accessed by a unique name from a client.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     * @param {perspective.view} view `view` to host.
     */
    host_view(name, view) {
        this._host(this._views, name, view);
    }

    /**
     * Cease hosting a `table` on this server.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     */
    eject_table(name) {
        delete this._tables[name];
    }

    /**
     * Cease hosting a `view` on this server.  Hosted objects
     * are automatically `eject`ed when their `delete()` method is called.
     *
     * @param {String} name
     */
    eject_view(name) {
        delete this._views[name];
    }
}
