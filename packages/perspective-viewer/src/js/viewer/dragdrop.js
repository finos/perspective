/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {detectIE} from "@jpmorganchase/perspective/src/js/utils.js";

function calc_index(event) {
    if (this._active_columns.children.length == 0) {
        return 0;
    } else {
        for (let cidx in this._active_columns.children) {
            let child = this._active_columns.children[cidx];
            if (child.offsetTop + child.offsetHeight > event.offsetY + this._active_columns.scrollTop) {
                return parseInt(cidx);
            }
        }
        return this._active_columns.children.length;
    }
}

export function undrag(event) {
    let div = event.target.getRootNode().host;
    let parent = div;
    if (parent.tagName === "PERSPECTIVE-VIEWER") {
        parent = event.target.parentElement;
    } else {
        parent = div.parentElement;
    }
    let idx = Array.prototype.slice.call(parent.children).indexOf(div.tagName === "PERSPECTIVE-ROW" ? div : event.target);
    let attr_name = parent.getAttribute("for");
    let pivots = JSON.parse(this.getAttribute(attr_name));
    pivots.splice(idx, 1);
    this.setAttribute(attr_name, JSON.stringify(pivots));

    if (detectIE()) {
        window.ShadyCSS.styleDocument();
    }
}

export function drop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove("dropping");
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
    if (name.indexOf("filter") > -1) {
        this.setAttribute(name, JSON.stringify(columns.concat([data])));
    } else if (name.indexOf("sort") > -1) {
        this.setAttribute(name, JSON.stringify(columns.concat([[data[0]]])));
    } else {
        this.setAttribute(name, JSON.stringify(columns.concat([data[0]])));
    }

    // Deselect the dropped column
    if (this._plugin.deselectMode === "pivots" && this._get_visible_column_count() > 1 && name !== "sort" && name !== "filter") {
        for (let x of this.shadowRoot.querySelectorAll("#active_columns perspective-row")) {
            if (x.getAttribute("name") === data[0]) {
                this._active_columns.removeChild(x);
                break;
            }
        }
        this._update_column_view();
    }

    this._debounce_update();
}

// Handle column actions
export function column_undrag(event) {
    let data = event.target.parentElement.parentElement;
    Array.prototype.slice.call(this._active_columns.children).map(x => {
        x.className = "";
    });
    if (this._get_visible_column_count() > 1 && event.dataTransfer.dropEffect !== "move") {
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
        this._active_columns.classList.remove("dropping");
        if (this._drop_target_hover.parentElement === this._active_columns) {
            this._active_columns.removeChild(this._drop_target_hover);
        }
        if (this._original_index !== -1) {
            this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[this._original_index]);
        }
        this._drop_target_hover.removeAttribute("drop-target");
    }
}

export function column_dragover(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (event.currentTarget.className !== "dropping") {
        event.currentTarget.classList.add("dropping");
    }
    if (!this._drop_target_hover.hasAttribute("drop-target")) {
        this._drop_target_hover.setAttribute("drop-target", true);
    }
    let new_index = calc_index.call(this, event);
    let current_index = Array.prototype.slice.call(this._active_columns.children).indexOf(this._drop_target_hover);
    if (current_index < new_index) new_index += 1;
    if (new_index < this._active_columns.children.length) {
        if (!this._active_columns.children[new_index].hasAttribute("drop-target")) {
            this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[new_index]);
        }
    } else {
        if (!this._active_columns.children[this._active_columns.children.length - 1].hasAttribute("drop-target")) {
            this._active_columns.appendChild(this._drop_target_hover);
        }
    }
}

export function column_drop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove("dropping");
    if (this._drop_target_hover.parentElement === this._active_columns) {
        this._drop_target_hover.removeAttribute("drop-target");
    }
    Array.prototype.slice.call(this._active_columns.children).map(x => {
        x.className = "";
    });
    let data = ev.dataTransfer.getData("text");
    if (!data) return;

    this._update_column_view();
}

export function drag_enter(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.currentTarget.classList.add("dropping");
}

export function allow_drop(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.currentTarget.classList.add("dropping");
    ev.dataTransfer.dropEffect = "move";
}

export function disallow_drop(ev) {
    if (ev.currentTarget == ev.target) {
        ev.stopPropagation();
        ev.preventDefault();
        ev.currentTarget.classList.remove("dropping");
    }
}
