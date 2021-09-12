/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DockPanel, SplitPanel} from "@lumino/widgets";
import {Signal} from "@lumino/signaling";

const DISCRETE_STEP_SIZE = 1;

function cloneMouseEvent(x, y, event) {
    const evt = document.createEvent("MouseEvent");
    evt.initMouseEvent(
        event.type,
        true,
        event.cancelable,
        event.view,
        event.detail,
        event.screenX,
        event.screenY,
        x,
        y,
        event.ctrlKey,
        event.altKey,
        event.shiftKey,
        event.metaKey,
        event.button,
        event.relatedTarget
    );
    return evt;
}

class DiscreteContext {
    _clamp(orient, client) {
        const margin = {width: 300, height: 200}[orient];
        const [min, max] = [margin, this._rect[orient] - margin];
        return client < min ? min : client > max ? max : undefined;
    }

    _block_move(key, client) {
        const val = this._offset_drag_start[key];
        const old = this._offset_drag_current[key];
        const method = client < old ? "ceil" : "floor";
        const diff = client - val;
        return (
            Math[method](diff / DISCRETE_STEP_SIZE) * DISCRETE_STEP_SIZE + val
        );
    }

    _check_prev(clientX, clientY) {
        const {x: old_clientX, y: old_clientY} = this._offset_drag_current;
        if (clientX !== old_clientX || clientY !== old_clientY) {
            this._offset_drag_current = {x: clientX, y: clientY};
            return true;
        }
        return false;
    }

    calculate_move({clientX, clientY}) {
        clientX -= this._rect.left;
        clientY -= this._rect.top;
        const blockX = this._block_move("x", clientX);
        const blockY = this._block_move("y", clientY);
        clientX =
            this._clamp("width", clientX) ||
            this._clamp("width", blockX) ||
            blockX;
        clientY =
            this._clamp("height", clientY) ||
            this._clamp("height", blockY) ||
            blockY;
        if (this._check_prev(clientX, clientY)) {
            return {x: clientX + this._rect.left, y: clientY + this._rect.top};
        }
    }

    constructor(x, y, rect) {
        this._rect = rect;
        this._offset_drag_start = this._offset_drag_current = {
            x: x - rect.left,
            y: y - rect.top,
        };
    }
}

function extend(base, handle) {
    return class extends base {
        handleEvent(event) {
            switch (event.type) {
                case "mousedown":
                    {
                        const elem = event.target;
                        if (!elem.classList.contains(handle)) {
                            break;
                        }
                        if (
                            [elem, elem.parentElement].some(
                                (x) =>
                                    x.getAttribute("data-orientation") ===
                                    "horizontal"
                            )
                        ) {
                            this.addClass("ew");
                        } else {
                            this.addClass("ns");
                        }
                        this.addClass("resizing");
                        const {clientX, clientY} = event;
                        this._offset_target = elem;
                        this._offset_target.classList.add("resizing");
                        this.context = new DiscreteContext(
                            clientX,
                            clientY,
                            this.node.getBoundingClientRect()
                        );
                    }
                    break;
                case "mousemove":
                    if (!DISCRETE_STEP_SIZE) {
                        super.handleEvent(event);
                    } else if (this.context && !event.shiftKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        const update = this.context.calculate_move(event);
                        if (update) {
                            const new_event = cloneMouseEvent(
                                update.x,
                                update.y,
                                event
                            );
                            super.handleEvent(new_event);
                        }
                        return;
                    }
                    break;
                case "mouseup":
                    {
                        this.removeClass("resizing");
                        this.removeClass("ew");
                        this.removeClass("ns");
                        this._offset_target.classList.remove("resizing");
                        delete this.context;
                    }
                    break;
                default:
                    break;
            }
            super.handleEvent(event);
        }
    };
}

export class DiscreteDockPanel extends extend(
    DockPanel,
    "p-DockPanel-handle"
) {}
export class DiscreteSplitPanel extends extend(
    SplitPanel,
    "p-SplitPanel-handle"
) {
    constructor(...args) {
        super(...args);
        this.layoutModified = new Signal(this);
    }
    onUpdateRequest(...args) {
        super.onUpdateRequest(...args);
        this.layoutModified.emit();
    }
    onResize(msg) {
        // for (const widget of toArray(this.widgets)) {
        //     widget.node.style.minWidth = `300px`;
        //     widget.node.style.minHeight = `200px`;
        // }
        super.onResize(msg);
    }
}
