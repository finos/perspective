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

import type * as psp from "@finos/perspective";
import type * as pspViewer from "@finos/perspective-viewer";

import * as utils from "./utils";

import * as React from "react";

export interface PerspectiveViewerProps {
    table?: psp.Table | Promise<psp.Table>;
    config?: pspViewer.ViewerConfigUpdate;
    onConfigUpdate?: (config: pspViewer.ViewerConfigUpdate) => void;
    onClick?: (data: pspViewer.PerspectiveClickEventDetail) => void;
    onSelect?: (data: pspViewer.PerspectiveSelectEventDetail) => void;

    // Applicable props from `React.HTMLAttributes`, which we cannot extend
    // directly because Perspective changes the signature of `onClick`.
    className?: string | undefined;
    hidden?: boolean | undefined;
    id?: string | undefined;
    slot?: string | undefined;
    style?: React.CSSProperties | undefined;
    tabIndex?: number | undefined;
    title?: string | undefined;
}

function PerspectiveViewerImpl(props: PerspectiveViewerProps) {
    const [viewer, setViewer] =
        React.useState<pspViewer.HTMLPerspectiveViewerElement>();

    React.useEffect(() => {
        return () => {
            viewer?.delete();
        };
    }, [viewer]);

    React.useEffect(() => {
        if (props.table) {
            viewer?.load(props.table);
        } else {
            viewer?.eject();
        }
    }, [viewer, props.table]);

    React.useEffect(() => {
        if (viewer && props.table && props.config) {
            viewer.restore(props.config);
        }
    }, [viewer, props.table, JSON.stringify(props.config)]);

    utils.usePspListener(viewer, "perspective-click", props.onClick);
    utils.usePspListener(viewer, "perspective-select", props.onSelect);
    utils.usePspListener(
        viewer,
        "perspective-config-update",
        props.onConfigUpdate
    );

    return (
        <perspective-viewer
            ref={(r) => setViewer(r ?? undefined)}
            id={props.id}
            className={props.className}
            hidden={props.hidden}
            slot={props.slot}
            style={props.style}
            tabIndex={props.tabIndex}
            title={props.title}
        />
    );
}

/**
 * A React wrapper component for `<perspective-viewer>` Custom Element.
 */
export const PerspectiveViewer: React.FC<PerspectiveViewerProps> = React.memo(
    PerspectiveViewerImpl
);
