// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { DOMWidgetView } from "@jupyter-widgets/base";
import { Message } from "@lumino/messaging";

import { PerspectiveWidget } from "./psp_widget";

export type PerspectiveJupyterWidgetOptions = {
    view: DOMWidgetView;
};

/**
 * PerspectiveJupyterWidget is the ipywidgets front-end for the Perspective Jupyterlab plugin.
 */
export class PerspectiveJupyterWidget extends PerspectiveWidget {
    private _view: DOMWidgetView;

    constructor(
        name = "Perspective",
        view: DOMWidgetView,
        server?: boolean,
        client?: boolean
    ) {
        super(name, view.el, server, client);
        this._view = view;
    }

    /**
     * Process the lumino message.
     *
     * Any custom lumino widget used inside a Jupyter widget should override
     * the processMessage function like this.
     */

    processMessage(msg: Message) {
        super.processMessage(msg);
        this._view.processLuminoMessage(msg);
    }

    /**
     * Dispose the widget.
     *
     * This causes the view to be destroyed as well with 'remove'
     */

    dispose() {
        if (this.isDisposed) {
            return;
        }

        super.dispose();
        if (this._view) {
            this._view.remove();
        }

        this._view = null;
    }
}
