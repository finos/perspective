/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DockPanel, SplitPanel, Widget} from "@phosphor/widgets";
import {toArray} from "@phosphor/algorithm";

const DISCRETE_STEP_SIZE = 1;

function cloneMouseEvent(x: number, y: number, e: MouseEvent): MouseEvent {
    const evt = document.createEvent("MouseEvent");
    evt.initMouseEvent(e.type, true, e.cancelable, e.view, e.detail, e.screenX, e.screenY, x, y, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget);
    return evt;
}

class DiscreteContext {
    _offset_drag_start: {[key: string]: number};
    _offset_drag_current: {[key: string]: number};
    _rect: ClientRect;

    _clamp(orient: "width" | "height", client: number): number | undefined {
        const margin = {width: 300, height: 200}[orient];
        const [min, max] = [margin, this._rect[orient] - margin];
        return client < min ? min : client > max ? max : undefined;
    }

    _block_move(key: "x" | "y", client: number): number {
        const val = this._offset_drag_start[key];
        const old = this._offset_drag_current[key];
        const method = client < old ? "ceil" : "floor";
        const diff = client - val;
        return Math[method](diff / DISCRETE_STEP_SIZE) * DISCRETE_STEP_SIZE + val;
    }

    _check_prev(clientX: number, clientY: number): boolean {
        const {x: old_clientX, y: old_clientY} = this._offset_drag_current;
        if (clientX !== old_clientX || clientY !== old_clientY) {
            this._offset_drag_current = {x: clientX, y: clientY};
            return true;
        }
        return false;
    }

    calculate_move({clientX, clientY}: MouseEvent): {x: number; y: number} | void {
        clientX -= this._rect.left;
        clientY -= this._rect.top;
        const blockX = this._block_move("x", clientX);
        const blockY = this._block_move("y", clientY);
        clientX = this._clamp("width", clientX) || this._clamp("width", blockX) || blockX;
        clientY = this._clamp("height", clientY) || this._clamp("height", blockY) || blockY;
        if (this._check_prev(clientX, clientY)) {
            return {x: clientX + this._rect.left, y: clientY + this._rect.top};
        }
    }

    constructor(x: number, y: number, rect: ClientRect) {
        this._rect = rect;
        this._offset_drag_start = this._offset_drag_current = {
            x: x - rect.left,
            y: y - rect.top
        };
    }
}

function extend(base: any, handle: string): any {
    return class extends base {
        private context: DiscreteContext;

        handleEvent(event: MouseEvent): void {
            switch (event.type) {
                case "mousedown":
                    {
                        const elem = event.target as HTMLElement;
                        if (!elem.classList.contains(handle)) {
                            break;
                        }
                        if ([elem, elem.parentElement].some(x => x.getAttribute("data-orientation") === "horizontal")) {
                            this.addClass("ew");
                        } else {
                            this.addClass("ns");
                        }
                        this.addClass("resizing");
                        const {clientX, clientY} = event;
                        this._offset_target = elem as HTMLElement;
                        this._offset_target.classList.add("resizing");
                        this.context = new DiscreteContext(clientX, clientY, this.node.getBoundingClientRect());
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
                            const new_event = cloneMouseEvent(update.x, update.y, event as MouseEvent);
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

export class DiscreteDockPanel extends (extend(DockPanel, "p-DockPanel-handle") as typeof DockPanel) {}
export class DiscreteSplitPanel extends (extend(SplitPanel, "p-SplitPanel-handle") as typeof SplitPanel) {
    onResize(msg: Widget.ResizeMessage): void {
        for (const widget of toArray(this.widgets)) {
            widget.node.style.minWidth = `300px`;
            widget.node.style.minHeight = `200px`;
        }
        super.onResize(msg);
    }
}
