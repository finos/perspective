/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {Message} from "@phosphor/messaging";
import {DOMWidgetView} from "@jupyter-widgets/base";

import {PerspectiveViewerOptions} from "@finos/perspective-viewer";
import {PerspectiveWidget, PerspectiveWidgetOptions} from "@finos/perspective-phosphor";

import perspective from "@finos/perspective";

import * as wasm from "@finos/perspective/dist/umd/psp.async.wasm";
import * as worker from "!!file-worker-loader?inline=true!@finos/perspective/dist/umd/perspective.wasm.worker.js";

if (perspective) {
    perspective.override({wasm, worker});
} else {
    console.warn("Perspective was undefined in jlab - wasm load errors may occur");
}

export type PerspectiveJupyterWidgetOptions = {
    view: DOMWidgetView;
};

/**
 * PerspectiveJupyterWidget is the ipywidgets front-end for the Perspective Jupyterlab plugin.
 */
export class PerspectiveJupyterWidget extends PerspectiveWidget {
    constructor(name = "Perspective", options: PerspectiveViewerOptions & PerspectiveJupyterWidgetOptions & PerspectiveWidgetOptions) {
        const view = options.view;
        delete options.view;
        super(name, options);
        this._view = view;
    }

    /**
     * Process the phosphor message.
     *
     * Any custom phosphor widget used inside a Jupyter widget should override
     * the processMessage function like this.
     */
    processMessage(msg: Message) {
        super.processMessage(msg);
        this._view.processPhosphorMessage(msg);
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

    private _view: DOMWidgetView;
}
