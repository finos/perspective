/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// Singleton `WeakMap`s to store metadata for td/th elements, as well as the
// datagrids themselves for each `<perspective-viewer>`
export const VIEWER_MAP = new WeakMap();
export const METADATA_MAP = new WeakMap();

// Output runtime debug info like FPS.
export const DEBUG = false;

// Double buffer when the viewport scrolls columns, rows or when the
// view is recreated.  Reduces render draw-in on some browsers, at the
// expense of performance.
export const DOUBLE_BUFFER_COLUMN = false;
export const DOUBLE_BUFFER_ROW = false;
export const DOUBLE_BUFFER_RECREATE = true;

// The largest size virtual <div> in (px) that Chrome can support without
// glitching.
export const BROWSER_MAX_HEIGHT = 10000000;

// Sort icons to use for Material UI.
// TODO this should be CSS.
export const ICON_MAP = {
    asc: "arrow_upward",
    desc: "arrow_downward",
    "asc abs": "\u21E7",
    "desc abs": "\u21E9",
    "col asc": "arrow_back",
    "col desc": "arrow_forward",
    "col asc abs": "\u21E8",
    "col desc abs": "\u21E6"
};
