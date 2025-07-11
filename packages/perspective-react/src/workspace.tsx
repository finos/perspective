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
import type * as pspWorkspace from "@finos/perspective-workspace";
import {
    PerspectiveWorkspaceConfig,
    ViewerConfigUpdateExt,
} from "@finos/perspective-workspace";

import * as utils from "./utils";

import * as React from "react";

interface PerspectiveWorkspaceProps {
    tables: Record<string, Promise<psp.Table>>;
    layout: PerspectiveWorkspaceConfig;
    onLayoutUpdate?: (detail: {
        layout: PerspectiveWorkspaceConfig;
        tables: Record<string, psp.Table | Promise<psp.Table>>;
    }) => void;
    onNewView?: (detail: {
        config: ViewerConfigUpdateExt;
        widget: pspWorkspace.PerspectiveViewerWidget;
    }) => void;
    onToggleGlobalFilter?: (detail: {
        widget: pspWorkspace.PerspectiveViewerWidget;
        isGlobalFilter: boolean;
    }) => void;
    id?: string;
    className?: string;
    style?: React.CSSProperties | undefined;
}

const PerspectiveWorkspaceImpl = React.forwardRef<
    pspWorkspace.HTMLPerspectiveWorkspaceElement | undefined,
    PerspectiveWorkspaceProps
>(
    (
        {
            tables,
            layout,
            onLayoutUpdate = () => {},
            onNewView = () => {},
            onToggleGlobalFilter = () => {},
            id,
            className,
            style,
        },
        ref
    ) => {
        const [workspace, setWorkspace] =
            React.useState<pspWorkspace.HTMLPerspectiveWorkspaceElement>();

        React.useImperativeHandle(ref, () => workspace, [workspace]);

        React.useEffect(() => {
            if (!workspace) return;
            workspace.restore(layout);
        }, [workspace, layout]);

        React.useEffect(() => {
            if (!workspace) return;
            workspace.replaceTables(tables);
        }, [workspace, tables]);

        utils.usePspListener(workspace, "workspace-new-view", onNewView);
        utils.usePspListener(
            workspace,
            "workspace-layout-update",
            onLayoutUpdate
        );
        utils.usePspListener(
            workspace,
            "workspace-toggle-global-filter",
            onToggleGlobalFilter
        );

        return (
            <perspective-workspace
                ref={(r) => setWorkspace(r ?? undefined)}
                id={id}
                className={className}
                style={style}
            ></perspective-workspace>
        );
    }
);

export const PerspectiveWorkspace = React.memo(PerspectiveWorkspaceImpl);
