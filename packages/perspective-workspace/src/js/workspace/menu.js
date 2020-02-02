/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {h} from "@phosphor/virtualdom";
import {Menu} from "@phosphor/widgets";

export class MenuRenderer extends Menu.Renderer {
    constructor(element) {
        super();
        this.workspace = element;
    }
    renderIcon(data) {
        let className = this.createIconClass(data);
        const name = data.item.command.split(":").pop();
        const content = getComputedStyle(this.workspace)
            .getPropertyValue(`--menu-${name}--content`)
            .replace(/['"]+/g, "");
        return h.div({className, content}, data.item.iconLabel);
    }
}
