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

import * as React from "react";
import type * as psp from "@finos/perspective";
import type * as pspViewer from "@finos/perspective-viewer";

function usePspListener<A>(
    viewer: HTMLElement | null,
    name: string,
    f?: (x: A) => void
) {
    React.useEffect(() => {
        if (!f) return;
        const ctx = new AbortController();
        const callback = (e: Event) => f((e as CustomEvent).detail);
        viewer?.addEventListener(name, callback, { signal: ctx.signal });
        return () => ctx.abort();
    }, [viewer, f]);
}

export interface PerspectiveViewerProps {
    table?: psp.Table | Promise<psp.Table>;
    config?: pspViewer.ViewerConfigUpdate;
    onConfigUpdate?: (config: pspViewer.ViewerConfigUpdate) => void;
    onClick?: (data: pspViewer.PerspectiveClickEventDetail) => void;
    onSelect?: (data: pspViewer.PerspectiveSelectEventDetail) => void;
}

function PerspectiveViewerImpl(props: PerspectiveViewerProps) {
    const [viewer, setViewer] =
        React.useState<pspViewer.HTMLPerspectiveViewerElement | null>(null);

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
        if (props.table && props.config) {
            viewer?.restore(props.config);
        }
    }, [viewer, props.table, JSON.stringify(props.config)]);

    usePspListener(viewer, "perspective-click", props.onClick);
    usePspListener(viewer, "perspective-select", props.onSelect);
    usePspListener(viewer, "perspective-config-update", props.onConfigUpdate);

    return <perspective-viewer ref={setViewer} />;
}

/**
 * A React wrapper component for `<perspective-viewer>` Custom Element.
 */
export const PerspectiveViewer: React.FC<PerspectiveViewerProps> = React.memo(
    PerspectiveViewerImpl
);
