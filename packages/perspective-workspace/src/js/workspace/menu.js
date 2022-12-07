/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { h } from "@lumino/virtualdom/src";
import { Menu } from "@lumino/widgets/src/menu";

export class MenuRenderer extends Menu.Renderer {
    constructor(element) {
        super();
        this.workspace = element;
    }

    formatLabel(data) {
        let { label, mnemonic } = data.item;
        if (mnemonic < 0 || mnemonic >= label.length) {
            return label;
        }

        let prefix = label.slice(0, mnemonic);
        let suffix = label.slice(mnemonic + 1);
        let char = label[mnemonic];
        let span = h.span(
            {
                className: "lm-Menu-itemMnemonic p-Menu-itemMnemonic",
            },
            char
        );

        return [prefix, span, suffix];
    }

    renderLabel(data) {
        let content = this.formatLabel(data);
        return h.div(
            {
                className: "lm-Menu-itemLabel p-Menu-itemLabel",
            },
            content
        );
    }

    renderSubmenu(data) {
        return h.div({
            className: "lm-Menu-itemSubmenuIcon" + " p-Menu-itemSubmenuIcon",
        });
    }

    renderItem(data) {
        let className = this.createItemClass(data);
        let dataset = this.createItemDataset(data);
        let aria = this.createItemARIA(data);
        return h.li(
            {
                className,
                dataset,
                tabindex: "0",
                onfocus: data.onfocus,
                ...aria,
            },
            this.renderIcon(data),
            this.renderLabel(data),
            this.renderShortcut(data),
            this.renderSubmenu(data)
        );
    }

    renderIcon(data) {
        let className = this.createIconClass(data);
        const name = data.item.command.split(":").pop();
        const content = getComputedStyle(this.workspace)
            .getPropertyValue(`--menu-${name}--content`)
            .replace(/['"]+/g, "")
            .trim();
        return h.div({ className, content }, data.item.iconLabel);
    }
}
