/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {ArrayExt} from "@lumino/algorithm";
import {ElementExt} from "@lumino/domutils";
import {TabBar} from "@lumino/widgets";
import {TabBarActions} from "./tabbarrenderer";

export class PerspectiveTabBar extends TabBar {
    constructor(options = {}) {
        super(options);
        this._addEventListeners();
        this.__content_node__;
    }

    onUpdateRequest(msg) {
        // NOT INERT!  This is a phosphor bug fix.
        // phosphor/virtualdom keeps a weakmap on contentNode which is later
        // reset - this causes the diff to double some elements.  Memoizing
        // prevent collection from the weakmap.
        this.__content_node__ = this.contentNode;
        super.onUpdateRequest(msg);
    }

    handleEvent(event) {
        this.retargetEvent(event);
        switch (event.type) {
            case "mousedown":
                const action = event.target.id;
                if (action === TabBarActions.Config) {
                    const tabs = this.contentNode.children;

                    // Find the index of the released tab.
                    const index = ArrayExt.findFirstIndex(tabs, tab => {
                        return ElementExt.hitTest(tab, event.clientX, event.clientY);
                    });

                    if (index < 0) {
                        break;
                    }

                    const title = this.titles[index];
                    title.owner.toggleConfig();
                }
                break;
        }
        super.handleEvent(event);
    }

    onResize(msg) {
        super.onResize(msg);
        this.checkCondensed(msg);
    }

    checkCondensed(msg) {
        const approxWidth = (msg ? msg.width : this.node.offsetWidth) / this.contentNode.children.length;
        if (approxWidth < 400) {
            this.node.classList.add("condensed");
        } else {
            this.node.classList.remove("condensed");
        }
    }

    /**
     * Shadow dom targets events at the host, not the clicked element, which
     * Phosphor dislikes.  This makes the event look like it is not crossing
     * the ShadowDom boundary.
     *
     */
    retargetEvent(event) {
        Object.defineProperty(event, "target", {value: event.composedPath()[0], enumerable: true});
        return event;
    }

    _addEventListeners() {
        this.node.addEventListener("contextmenu", event => {
            const widget = this.currentTitle.owner;
            this.parent.parent.parent.showContextMenu(widget, event);
            event.preventDefault();
        });
    }
}
