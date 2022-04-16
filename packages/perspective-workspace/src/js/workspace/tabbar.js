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
import {TabBar} from "@lumino/widgets/src/tabbar";
import {TabBarItems, DEFAULT_TITLE} from "./tabbarrenderer";

export class PerspectiveTabBar extends TabBar {
    constructor(options = {}) {
        super(options);
        this._addEventListeners();
        this.__content_node__;
    }

    onUpdateRequest(msg) {
        // NOT INERT!  This is a lumino bug fix.
        // lumino/virtualdom keeps a weakmap on contentNode which is later
        // reset - this causes the diff to double some elements.  Memoizing
        // prevent collection from the weakmap.
        this.__content_node__ = this.contentNode;
        super.onUpdateRequest(msg);
        this._check_shade();
    }

    _check_shade() {
        if (
            Array.from(this.contentNode.children).filter(
                (x) =>
                    x.classList.contains("settings_open") &&
                    x.classList.contains("p-mod-current")
            ).length > 0
        ) {
            this.contentNode.classList.add("inactive-blur");
        } else {
            this.contentNode.classList.remove("inactive-blur");
        }
    }

    handleEvent(event) {
        this.retargetEvent(event);
        switch (event.type) {
            case "contextmenu":
                const widget = this.currentTitle.owner;
                this.parent.parent.parent.showContextMenu(widget, event);
                event.preventDefault();
                break;

            case "dblclick":
                if (event.target.id === TabBarItems.Label) {
                    this.onTitleChangeRequest(event);
                }
                break;

            case "mousedown":
                if (event.target.id === TabBarItems.Config) {
                    const tabs = this.contentNode.children;

                    // Find the index of the released tab.
                    const index = ArrayExt.findFirstIndex(tabs, (tab) => {
                        return ElementExt.hitTest(
                            tab,
                            event.clientX,
                            event.clientY
                        );
                    });

                    if (index < 0) {
                        break;
                    }

                    const title = this.titles[index];
                    title.owner.viewer.toggleConfig();
                    return;
                }
                break;
        }
        super.handleEvent(event);
    }

    onTitleChangeRequest(event) {
        const oldValue = event.target.value;

        const stopEvents = (event) => event.stopPropagation();

        const onCancel = () => {
            this.title.label = oldValue;
            event.target.value = oldValue;
            event.target.setAttribute("readonly", "");
            removeEventListeners();
        };

        const onEnter = (event) => {
            if (event.keyCode === 13) {
                removeEventListeners();
                this.currentTitle.owner.name = event.target.value;
                event.target.value = event.target.value || DEFAULT_TITLE;
                event.target.setAttribute("readonly", "");
                event.target.blur();
            }
        };

        const listeners = {
            mousemove: stopEvents,
            mousedown: stopEvents,
            mouseup: stopEvents,
            keydown: onEnter,
            blur: onCancel,
        };

        const removeEventListeners = () => {
            for (let eventName in listeners) {
                event.target.removeEventListener(
                    eventName,
                    listeners[eventName]
                );
            }
        };

        for (let eventName in listeners) {
            event.target.addEventListener(eventName, listeners[eventName]);
        }

        event.target.removeAttribute("readonly");

        if (oldValue === DEFAULT_TITLE) {
            event.target.value = "";
        }

        event.target.focus();
    }

    onResize(msg) {
        super.onResize(msg);
        this.checkCondensed(msg);
    }

    checkCondensed(msg) {
        const approxWidth =
            (msg ? msg.width : this.node.offsetWidth) /
            this.contentNode.children.length;
        if (approxWidth < 400) {
            this.node.classList.add("condensed");
        } else {
            this.node.classList.remove("condensed");
        }
    }

    /**
     * Shadow dom targets events at the host, not the clicked element, which
     * Lumino dislikes.  This makes the event look like it is not crossing
     * the ShadowDom boundary.
     *
     */
    retargetEvent(event) {
        Object.defineProperty(event, "target", {
            value: event.composedPath()[0],
            enumerable: true,
        });
        return event;
    }

    _addEventListeners() {
        this.tabActivateRequested.connect(() => {
            this.currentTitle.owner.viewer.notifyResize(true);
        });
        this.node.addEventListener("dblclick", this);
        this.node.addEventListener("contextmenu", this);
    }
}
