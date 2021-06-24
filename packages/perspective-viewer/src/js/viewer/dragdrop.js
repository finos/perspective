/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {swap} from "../utils.js";

function calc_index(event) {
    if (this._active_columns.children.length == 0) {
        return 0;
    } else {
        let is_last_null = false;
        for (let cidx in this._active_columns.children) {
            let child = this._active_columns.children[cidx];
            is_last_null = is_last_null || child?.classList?.contains("null-column");
            if (child.offsetTop + child.offsetHeight > event.offsetY + this._active_columns.scrollTop) {
                return parseInt(cidx);
            }
        }
        let last_index = this._active_columns.children.length;
        if (is_last_null) {
            last_index--;
        }
        return last_index;
    }
}

export function dragend(event) {
    let div = event.target.getRootNode().host;
    let parent = div;
    if (parent.tagName === "PERSPECTIVE-VIEWER") {
        parent = event.target.parentElement;
    } else {
        parent = div.parentElement;
    }
    let idx = Array.prototype.slice.call(parent.children).indexOf(div.tagName === "PERSPECTIVE-ROW" ? div : event.target);
    let attr_name = parent.getAttribute("for");
    if (this.hasAttribute(attr_name)) {
        let attr_value = JSON.parse(this.getAttribute(attr_name));
        attr_value.splice(idx, 1);
        if (attr_value.length === 0) {
            this.removeAttribute(attr_name);
        } else {
            this.setAttribute(attr_name, JSON.stringify(attr_value));
        }
    }
}

export function drop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove("dropping");
    DRAG_COUNT_MAP = new WeakMap();
    if (this._drop_target_hover) {
        this._drop_target_hover.removeAttribute("drop-target");
    }
    let data = ev.dataTransfer.getData("text");
    if (!data) return;
    data = JSON.parse(data);

    // Update the columns attribute
    let name = ev.currentTarget.querySelector("ul").getAttribute("for") || ev.currentTarget.getAttribute("id").replace("_", "-");
    let columns = JSON.parse(this.getAttribute(name) || "[]");
    let data_index = columns.indexOf(data[0]);
    if (data_index !== -1) {
        columns.splice(data_index, 1);
    }

    const filtering = name.indexOf("filter") > -1;

    // Deselect/select the dropped column.
    (async () => {
        let plugin = await this._vieux.get_plugin();
        if (filtering) {
            this.setAttribute(name, JSON.stringify(columns.concat([data])));
        } else if (name.indexOf("sort") > -1) {
            this.setAttribute(name, JSON.stringify(columns.concat([[data[0]]])));
        } else {
            this.setAttribute(name, JSON.stringify(columns.concat([data[0]])));
        }

        if (plugin.deselectMode === "pivots" && this._get_visible_column_count() > 1 && name !== "sort" && !filtering) {
            for (let x of this.shadowRoot.querySelectorAll("#active_columns perspective-row")) {
                if (x.getAttribute("name") === data[0]) {
                    this._active_columns.removeChild(x);
                    break;
                }
            }
            this._update_column_view();
        }

        this._debounce_update();
    })();
}

export function column_dragend(event) {
    let data = event.target.parentElement.parentElement;
    if (Array.prototype.slice(this._active_columns.children).indexOf(data) > -1 && this._get_visible_column_count() > 1 && event.dataTransfer.dropEffect !== "move") {
        this._active_columns.removeChild(data);
        this._update_column_view();
    }
    this._active_columns.classList.remove("dropping");
}

export function column_dragleave(event) {
    let src = event.relatedTarget;
    while (src && src !== this._active_columns) {
        src = src.parentElement;
    }
    if (src === null) {
        this._vieux.get_plugin().then(() => {
            this._active_columns.classList.remove("dropping");
            if (this._drop_target_null) {
                this._active_columns.replaceChild(this._drop_target_null, this._drop_target_hover);
                delete this._drop_target_null;
            }
            if (this._drop_target_hover.parentElement === this._active_columns) {
                this._active_columns.removeChild(this._drop_target_hover);
            }
            if (this._original_index !== -1) {
                this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[this._original_index]);
            }
            this._drop_target_hover.removeAttribute("drop-target");
        });
    }
}

function _unset_drop_target_null() {
    if (this._drop_target_null) {
        if (this._drop_target_null.parentElement === this._active_columns) {
            swap(this._active_columns, this._drop_target_hover, this._drop_target_null);
        } else {
            this._active_columns.replaceChild(this._drop_target_null, this._drop_target_hover);
        }
        delete this._drop_target_null;
    }
}

function column_swap(new_index) {
    _unset_drop_target_null.call(this);
    if (this._active_columns.children[new_index]) {
        if (this._drop_target_hover !== this._active_columns.children[new_index]) {
            this._drop_target_null = this._active_columns.children[new_index];
            swap(this._active_columns, this._active_columns.children[new_index], this._drop_target_hover);
        }
    }
}

function column_replace(new_index) {
    _unset_drop_target_null.call(this);
    if (this._active_columns.children[new_index]) {
        this._drop_target_null = this._active_columns.children[new_index];
        this._active_columns.replaceChild(this._drop_target_hover, this._active_columns.children[new_index]);
    }
}

export function column_dragover(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!this._drop_target_hover.hasAttribute("drop-target")) {
        this._drop_target_hover.toggleAttribute("drop-target", true);
    }
    let new_index = calc_index.call(this, event);
    const current_index = Array.prototype.slice.call(this._active_columns.children).indexOf(this._drop_target_hover);
    const over_elem = this._active_columns.children[new_index];
    (async () => {
        let plugin = await this._vieux.get_plugin();
        const to_replace = new_index < plugin.initial?.names?.length - 1;
        const is_diff = this._drop_target_hover !== this._active_columns.children[new_index];
        const from_active = this._original_index !== -1;
        const from_replace = from_active && this._original_index < plugin.initial?.names?.length - 1;
        const from_append = from_active && this._original_index >= plugin.initial?.names?.length - 1;
        const from_required = from_active && this._original_index < plugin.initial?.count;
        const to_required = new_index < plugin.initial?.count;
        const to_null = !to_required && over_elem?.classList.contains("null-column");
        if (from_required && to_null) {
            _unset_drop_target_null.call(this);
        } else if (to_replace && from_append && is_diff) {
            _unset_drop_target_null.call(this);
            const from_last =
                this._original_index === plugin.initial?.names?.length - 1 &&
                this._drop_target_hover === this._active_columns.children[this._original_index] &&
                this._active_columns.children.length === plugin.initial?.names?.length;
            if (from_last) {
                this._drop_target_null = this._active_columns.children[new_index];
                swap(this._active_columns, this._active_columns.children[new_index], this._drop_target_hover);
            } else if (!this._active_columns.children[new_index]?.classList.contains("null-column")) {
                this._drop_target_null = this._active_columns.children[new_index];
                this._active_columns.replaceChild(this._drop_target_hover, this._active_columns.children[new_index]);
                this._active_columns.insertBefore(this._drop_target_null, this._active_columns.children[this._original_index]);
            } else {
                if (this._drop_target_hover !== this._active_columns.children[new_index]) {
                    this._drop_target_null = this._active_columns.children[new_index];
                    this._active_columns.replaceChild(this._drop_target_hover, this._active_columns.children[new_index]);
                }
            }
        } else if (to_replace && from_active && is_diff) {
            column_swap.call(this, new_index);
        } else if (to_replace && !from_active && is_diff) {
            column_replace.call(this, new_index);
        } else if (!to_replace && from_replace && is_diff) {
            column_swap.call(this, new_index);
        } else if (to_null && from_active) {
            column_swap.call(this, new_index);
        } else if (to_null && !from_active) {
            column_replace.call(this, new_index);
        } else if (current_index < new_index) {
            if (new_index + 1 < this._active_columns.children.length) {
                if (!this._active_columns.children[new_index + 1].hasAttribute("drop-target")) {
                    _unset_drop_target_null.call(this);
                    this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[new_index + 1]);
                }
            } else {
                if (!this._active_columns.children[this._active_columns.children.length - 1].hasAttribute("drop-target")) {
                    _unset_drop_target_null.call(this);
                    this._active_columns.appendChild(this._drop_target_hover);
                }
            }
        } else if (new_index < this._active_columns.children.length) {
            if (!this._active_columns.children[new_index].hasAttribute("drop-target")) {
                _unset_drop_target_null.call(this);
                this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[new_index]);
            }
        } else {
            if (!this._active_columns.children[this._active_columns.children.length - 1].hasAttribute("drop-target")) {
                _unset_drop_target_null.call(this);
                this._active_columns.appendChild(this._drop_target_hover);
            }
        }
    })();
}

export function column_drop(ev) {
    ev.preventDefault();
    delete this._drop_target_null;
    ev.currentTarget.classList.remove("dropping");
    DRAG_COUNT_MAP = new WeakMap();
    if (this._drop_target_hover.parentElement === this._active_columns) {
        this._drop_target_hover.removeAttribute("drop-target");
    }
    let data = ev.dataTransfer.getData("text");
    if (!data) return;

    this._update_column_view();
}

export function dragover(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

let DRAG_COUNT_MAP = new WeakMap();

function dragenterleave(event) {
    let dragHoverCount = DRAG_COUNT_MAP.get(event.currentTarget) || 0;
    event.type === "dragenter" ? dragHoverCount++ : dragHoverCount--;
    DRAG_COUNT_MAP.set(event.currentTarget, dragHoverCount);
    event.currentTarget.classList.toggle("dropping", dragHoverCount > 0);
    event.preventDefault();
}

export const dragenter = dragenterleave;
export const dragleave = dragenterleave;
