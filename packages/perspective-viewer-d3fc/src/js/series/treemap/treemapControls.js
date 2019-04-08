/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {getOrCreateElement} from "../../utils/utils";
import template from "../../../html/parent-controls.html";

export const getGoToParentControls = container =>
    getOrCreateElement(container, ".parent-controls", () =>
        container
            .append("div")
            .attr("class", "parent-controls")
            .style("display", "none")
            .html(template)
    );
