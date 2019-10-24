import {PerspectiveWidget, PerspectiveWidgetOptions} from "./widget";
import {DockLayout} from "@phosphor/widgets";

/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/* defines */
export const MIME_TYPE = "application/psp+json";

export const PSP_CLASS = "PSPViewer";

export const PSP_CONTAINER_CLASS = "PSPContainer";

export const PSP_CONTAINER_CLASS_DARK = "PSPContainer-dark";

type WidgetMapFuction = (widget: PerspectiveWidget | PerspectiveWidgetOptions) => PerspectiveWidget | PerspectiveWidgetOptions | void | Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapWidgets = (widgetFunc: WidgetMapFuction, layout: any): any => {
    if (layout.main) {
        layout.main = mapWidgets(widgetFunc, layout.main);
    } else if (layout.children) {
        layout.children = layout.children.map((x: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig) => mapWidgets(widgetFunc, x));
    } else if (layout.widgets) {
        layout.widgets = layout.widgets.map((x: PerspectiveWidget | PerspectiveWidgetOptions) => widgetFunc(x) || x);
    }
    return layout;
};
