/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export class CancelTask {
    constructor(on_cancel) {
        this._on_cancel = on_cancel;
        this._cancelled = false;
    }

    cancel() {
        if (!this._cancelled && this._on_cancel) {
            this._on_cancel();
        }
        this._cancelled = true;
    }

    get cancelled() {
        return this._cancelled;
    }
}