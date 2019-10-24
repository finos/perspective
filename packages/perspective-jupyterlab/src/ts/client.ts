/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DOMWidgetView} from "@jupyter-widgets/base";
import {Client} from "@finos/perspective/dist/esm/api/client";

/**
 * The schema for a message passed to and from `PerspectiveJupyterClient`.
 */
export interface PerspectiveJupyterMessage {
    id: number;
    type: string;
    data: string;
}

/**
 * `PerspectiveJupyterClient` acts as a message bus between the frontend and backend,
 * passing messages from `perspective-viewer` (method calls, `to_format()` calls, etc.) to
 * the `PerspectiveManager` on the python side of the plugin.
 *
 * This client implements the `Client` class as defined in `@finos/perspective/api`.
 */
export class PerspectiveJupyterClient extends Client {
    view: DOMWidgetView;

    /**
     * Create a new instance of the client.
     *
     * @param view {DOMWidgetView} the plugin view that can send messages to the Python backend.
     */
    constructor(view: DOMWidgetView) {
        super();
        this.view = view;
    }

    /**
     * Given a message, pass it to the `PerspectiveManager` instance on the ipywidget.
     *
     * The sent message conforms to the `PerspectiveJupyterMessage` interface.
     *
     * @param msg {any} the message to pass to the `PerspectiveManager`.
     */
    send(msg: any): void {
        const serialized = JSON.stringify(msg);
        this.view.send({
            id: msg.id,
            type: "cmd",
            data: serialized
        });
    }
}
