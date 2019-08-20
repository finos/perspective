/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {PropsBuilder} from "@finos/perspective-viewer/dist/esm/custom_styles";

const properties = new PropsBuilder();
const title = `--hypergrid`;

properties.add_fonts({
    font: title,
    columnHeaderFont: `${title}-header`,
    rowHeaderFont: title,
    treeHeaderFont: title
});

properties.add_styles({
    treeHeaderBackgroundColor: `${title}-tree-header--background`,
    backgroundColor: `${title}--background`,
    treeHeaderColor: `${title}-tree-header--color`,
    color: [`${title}--color`, `color`],
    columnHeaderBackgroundColor: `${title}-header--background`,
    columnHeaderSeparatorColor: `${title}-separator--color`,
    columnHeaderColor: `${title}-header--color`,
    columnColorNumberPositive: `${title}-positive--color`,
    columnColorNumberNegative: `${title}-negative--color`,
    columnBackgroundColorNumberPositive: `${title}-positive--background`,
    columnBackgroundColorNumberNegative: `${title}-negative--background`,
    halign: `${title}--text-align`,
    columnHeaderHalign: `${title}--text-align`,
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: `${title}-cell-hover--background`,
        color: `${title}-cell-hover--color`
    }
});

properties.add_measures({
    width: `${title}--width`,
    minimumColumnWidth: `${title}--min-width`,
    maximumColumnWidth: `${title}--max-width`
});

properties.add_styles({
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: `${title}-row-hover--background`,
        color: `${title}-row-hover--color`
    }
});

export function get_styles(elem) {
    return properties.get_properties(elem);
}

export function clear_styles(elem) {
    return properties.clear_properties(elem);
}
