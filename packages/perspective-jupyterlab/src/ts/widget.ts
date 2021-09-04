/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {Message} from "@lumino/messaging";
import {DOMWidgetView} from "@jupyter-widgets/base";

import {PerspectiveViewerConfig} from "@finos/perspective-viewer";
import {PerspectiveWidget, PerspectiveWidgetOptions} from "./psp_widget";

export type PerspectiveJupyterWidgetOptions = {
    view: DOMWidgetView;
};

/**
 * PerspectiveJupyterWidget is the ipywidgets front-end for the Perspective Jupyterlab plugin.
 */
export class PerspectiveJupyterWidget extends PerspectiveWidget {
    constructor(name = "Perspective", options: PerspectiveViewerConfig & PerspectiveJupyterWidgetOptions & PerspectiveWidgetOptions) {
        const view = options.view;
        delete options.view;
        super(name, options);
        this._view = view;
    }

    /**
     * Process the lumino message.
     *
     * Any custom lumino widget used inside a Jupyter widget should override
     * the processMessage function like this.
     */
    processMessage(msg: Message): void {
        super.processMessage(msg);
        this._view.processPhosphorMessage(msg);
    }

    /**
     * Dispose the widget.
     *
     * This causes the view to be destroyed as well with 'remove'
     */
    dispose(): void {
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
