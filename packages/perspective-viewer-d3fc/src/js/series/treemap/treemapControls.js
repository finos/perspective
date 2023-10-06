// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { getOrCreateElement } from "../../utils/utils";
import template from "../../../html/parent-controls.html";

export function parentControls(container) {
    let onClick = null;
    let text = null;
    let hide = true;
    let deactivated = false;

    const parent = getOrCreateElement(container, ".parent-controls", () =>
        container
            .append("div")
            .attr("class", "parent-controls")
            .style("display", hide ? "none" : "")
            .html(template),
    );

    const controls = () => {
        parent
            .style("display", hide ? "none" : "")
            .select("#goto-parent")
            .style("pointer-events", deactivated ? "none" : null)
            .html(`⇪ ${text}`)
            .on("click", () => onClick());
    };

    controls.deactivate = (...args) => {
        if (!args.length) {
            return deactivated;
        }
        deactivated = args[0];

        const button = parent.select("#goto-parent");
        if (deactivated) {
            button.style("pointer-events", "none");
        } else {
            button.style("pointer-events", null);
        }

        return controls;
    };

    controls.hide = (...args) => {
        if (!args.length) {
            return hide;
        }
        hide = args[0];
        return controls;
    };

    controls.text = (...args) => {
        if (!args.length) {
            return text;
        }
        text = args[0];
        return controls;
    };

    controls.onClick = (...args) => {
        if (!args.length) {
            return onClick;
        }
        onClick = args[0];
        return controls;
    };

    return controls;
}
