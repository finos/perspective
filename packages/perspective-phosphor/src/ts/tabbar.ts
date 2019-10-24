/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {ArrayExt} from "@phosphor/algorithm";
import {ElementExt} from "@phosphor/domutils";
import {Message} from "@phosphor/messaging";
import {Signal} from "@phosphor/signaling";
import {TabBar, Widget, Title} from "@phosphor/widgets";
import {TabBarActions} from "./tabbarrenderer";

export interface TabMaximizeArgs {
    title: Title<Widget>;
}
export class PerspectiveTabBar extends TabBar<Widget> {
    private __content_node__: HTMLUListElement;
    private _tabMaximizeRequested: Signal<PerspectiveTabBar, TabMaximizeArgs>;
    private _toggleConfigRequested: Signal<PerspectiveTabBar, TabMaximizeArgs>;

    constructor(options: TabBar.IOptions<Widget> = {}) {
        super(options);
        this._tabMaximizeRequested = new Signal(this);
        this._toggleConfigRequested = new Signal(this);
        this.__content_node__;
    }

    public get tabMaximizeRequested(): Signal<PerspectiveTabBar, TabMaximizeArgs> {
        return this._tabMaximizeRequested;
    }

    public get toggleConfigRequested(): Signal<PerspectiveTabBar, TabMaximizeArgs> {
        return this._toggleConfigRequested;
    }

    public onUpdateRequest(msg: Message): void {
        // NOT INERT!  This is a phosphor bug fix.
        // phosphor/virtualdom keeps a weakmap on contentNode which is later
        // reset - this causes the diff to double some elements.  Memoizing
        // prevent collection from the weakmap.
        // eslint-disable-next-line @typescript-eslint/camelcase
        this.__content_node__ = this.contentNode;
        super.onUpdateRequest(msg);
    }

    public handleEvent(event: MouseEvent): void {
        switch (event.type) {
            case "mousedown":
                const action: string = (event.target as HTMLElement).id;
                if ([TabBarActions.Maximize as string, TabBarActions.Config].indexOf(action) === -1) {
                    break;
                }
                const tabs = this.contentNode.children;

                // Find the index of the released tab.
                const index = ArrayExt.findFirstIndex(tabs, tab => {
                    return ElementExt.hitTest(tab, event.clientX, event.clientY);
                });

                if (index < 0) {
                    break;
                }

                const title = this.titles[index];
                if (action === TabBarActions.Maximize) {
                    this._tabMaximizeRequested && this._tabMaximizeRequested.emit({title});
                } else {
                    this._toggleConfigRequested.emit({title});
                }
                break;
        }
        super.handleEvent(event);
    }

    public onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.checkCondensed(msg);
    }

    public checkCondensed(msg: Widget.ResizeMessage): void {
        const approxWidth = (msg ? msg.width : this.node.offsetWidth) / this.contentNode.children.length;
        if (approxWidth < 400) {
            this.node.classList.add("condensed");
        } else {
            this.node.classList.remove("condensed");
        }
    }
}
