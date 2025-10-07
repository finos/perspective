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

// const PRIVATE = Symbol("Area Mouse Selection");
const MOUSE_SELECTED_AREA_CLASS = "mouse-selected-area";

export const addAreaMouseSelection = (
    datagrid,
    table,
    { className = MOUSE_SELECTED_AREA_CLASS, selected = [] } = {},
) => {
    datagrid.model._selection_state = {
        selected_areas: selected,
        dirty: true,
    };

    table.addEventListener(
        "mousedown",
        getMousedownListener(datagrid, table, className),
    );

    table.addEventListener(
        "mouseover",
        getMouseoverListener(datagrid, table, className),
    );

    table.addEventListener(
        "mouseup",
        getMouseupListener(datagrid, table, className),
    );

    table.addStyleListener(() =>
        applyMouseAreaSelections(datagrid, table, className),
    );

    return table;
};

const getMousedownListener = (datagrid, table, className) => (event) => {
    if (
        event.button === 0 &&
        (datagrid.model._edit_mode === "SELECT_REGION" ||
            datagrid.model._edit_mode === "SELECT_ROW" ||
            datagrid.model._edit_mode === "SELECT_COLUMN")
    ) {
        datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES = {};
        const meta = table.getMeta(event.target);
        if (meta && meta.x !== undefined && meta.y !== undefined) {
            datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES = {
                x: meta.x,
                y: meta.y,
            };

            // // TODO: Enable multiselect here
            // if (!event.ctrlKey && !event.metaKey) {
            //     datagrid.model._selection_state.selected_areas = [];
            // }

            datagrid.model._selection_state.old_selected_areas =
                datagrid.model._selection_state.selected_areas;
            datagrid.model._selection_state.selected_areas = [];

            const start = {
                x0: meta.x,
                x1: meta.x,
                y0: meta.y,
                y1: meta.y,
            };
            datagrid.model._selection_state.potential_selection = start;
            applyMouseAreaSelections(
                datagrid,
                table,
                className,
                datagrid.model._selection_state.selected_areas.concat([start]),
            );

            return;
        }
    }

    datagrid.model._selection_state.selected_areas = [];
};

const getMouseoverListener = (datagrid, table, className) => (event) => {
    if (
        datagrid.model._edit_mode === "SELECT_REGION" ||
        datagrid.model._edit_mode === "SELECT_ROW" ||
        datagrid.model._edit_mode === "SELECT_COLUMN"
    ) {
        if (
            datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES &&
            datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES.x !==
                undefined
        ) {
            const meta = table.getMeta(event.target);
            if (meta && meta.x !== undefined && meta.y !== undefined) {
                const potentialSelection = {
                    x0: Math.min(
                        meta.x,
                        datagrid.model._selection_state
                            .CURRENT_MOUSEDOWN_COORDINATES.x,
                    ),
                    x1: Math.max(
                        meta.x,
                        datagrid.model._selection_state
                            .CURRENT_MOUSEDOWN_COORDINATES.x,
                    ),
                    y0: Math.min(
                        meta.y,
                        datagrid.model._selection_state
                            .CURRENT_MOUSEDOWN_COORDINATES.y,
                    ),
                    y1: Math.max(
                        meta.y,
                        datagrid.model._selection_state
                            .CURRENT_MOUSEDOWN_COORDINATES.y,
                    ),
                };

                datagrid.model._selection_state.potential_selection =
                    potentialSelection;

                applyMouseAreaSelections(
                    datagrid,
                    table,
                    className,
                    datagrid.model._selection_state.selected_areas.concat([
                        potentialSelection,
                    ]),
                );
            }
        }
    }
};

const getMouseupListener = (datagrid, table, className) => (event) => {
    if (
        datagrid.model._edit_mode === "SELECT_REGION" ||
        datagrid.model._edit_mode === "SELECT_ROW" ||
        datagrid.model._edit_mode === "SELECT_COLUMN"
    ) {
        const meta = table.getMeta(event.target);
        if (datagrid.model._selection_state.old_selected_areas?.length > 0) {
            const selected =
                datagrid.model._selection_state.old_selected_areas[0];
            if (
                selected.x0 === selected.x1 &&
                selected.y0 === selected.y1 &&
                selected.x0 === meta.x &&
                selected.y0 === meta.y
            ) {
                datagrid.model._selection_state.selected_areas = [];
                datagrid.model._selection_state.old_selected_areas = [];
                datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES =
                    {};
                datagrid.model._selection_state.potential_selection = undefined;
                applyMouseAreaSelections(datagrid, table, className, []);
                return;
            }
        }

        datagrid.model._selection_state.old_selected_areas = [];

        if (
            datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES &&
            datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES.x !==
                undefined &&
            meta.x !== undefined &&
            meta.y !== undefined
        ) {
            const selection = {
                x0: Math.min(
                    meta.x,
                    datagrid.model._selection_state
                        .CURRENT_MOUSEDOWN_COORDINATES.x,
                ),
                x1: Math.max(
                    meta.x,
                    datagrid.model._selection_state
                        .CURRENT_MOUSEDOWN_COORDINATES.x,
                ),
                y0: Math.min(
                    meta.y,
                    datagrid.model._selection_state
                        .CURRENT_MOUSEDOWN_COORDINATES.y,
                ),
                y1: Math.max(
                    meta.y,
                    datagrid.model._selection_state
                        .CURRENT_MOUSEDOWN_COORDINATES.y,
                ),
            };
            datagrid.model._selection_state.selected_areas.push(selection);
            applyMouseAreaSelections(datagrid, table, className);
        }

        datagrid.model._selection_state.CURRENT_MOUSEDOWN_COORDINATES = {};
        datagrid.model._selection_state.potential_selection = undefined;
    }
};

function set_psp_selection(viewer, datagrid, { x0, x1, y0, y1 }) {
    const viewport = {};
    const mode = datagrid.model._edit_mode;
    if (
        x0 !== undefined &&
        ["SELECT_COLUMN", "SELECT_REGION"].indexOf(mode) > -1
    ) {
        viewport.start_col = x0;
    }

    if (
        x1 !== undefined &&
        ["SELECT_COLUMN", "SELECT_REGION"].indexOf(mode) > -1
    ) {
        viewport.end_col = x1 + 1;
    }

    if (
        y0 !== undefined &&
        ["SELECT_ROW", "SELECT_REGION"].indexOf(mode) > -1
    ) {
        viewport.start_row = y0;
    }

    if (
        y1 !== undefined &&
        ["SELECT_ROW", "SELECT_REGION"].indexOf(mode) > -1
    ) {
        viewport.end_row = y1 + 1;
    }

    viewer.setSelection(viewport);
}

export const applyMouseAreaSelections = (
    datagrid,
    table,
    className,
    selected,
) => {
    if (
        datagrid.model._edit_mode === "SELECT_REGION" ||
        datagrid.model._edit_mode === "SELECT_ROW" ||
        datagrid.model._edit_mode === "SELECT_COLUMN"
    ) {
        selected = datagrid.model._selection_state.selected_areas.slice(0);
        if (datagrid.model._selection_state.potential_selection) {
            selected.push(datagrid.model._selection_state.potential_selection);
        }

        const tds = table.querySelectorAll("tbody td");

        if (selected.length > 0) {
            set_psp_selection(datagrid.parentElement, datagrid, selected[0]);
            applyMouseAreaSelection(datagrid, table, selected, className);
        } else {
            datagrid.parentElement.setSelection();
            for (const td of tds) {
                td.classList.remove(className);
            }
        }
    } else if (datagrid.model._selection_state.dirty) {
        datagrid.model._selection_state.dirty = false;
        const tds = table.querySelectorAll("tbody td");
        for (const td of tds) {
            td.classList.remove(className);
        }
    }
};

const applyMouseAreaSelection = (datagrid, table, selected, className) => {
    if (datagrid.model._edit_mode === "SELECT_REGION" && selected.length > 0) {
        const tds = table.querySelectorAll("tbody td");

        for (const td of tds) {
            const meta = table.getMeta(td);
            let rendered = false;
            for (const { x0, x1, y0, y1 } of selected) {
                if (
                    x0 !== undefined &&
                    y0 !== undefined &&
                    x1 !== undefined &&
                    y1 !== undefined
                ) {
                    if (
                        x0 <= meta.x &&
                        meta.x <= x1 &&
                        y0 <= meta.y &&
                        meta.y <= y1
                    ) {
                        rendered = true;
                        datagrid.model._selection_state.dirty = true;
                        td.classList.add(className);
                    }
                }
            }

            if (!rendered) {
                td.classList.remove(className);
            }
        }
    } else if (
        datagrid.model._edit_mode === "SELECT_ROW" &&
        selected.length > 0
    ) {
        const tds = table.querySelectorAll("tbody td");

        for (const td of tds) {
            const meta = table.getMeta(td);
            let rendered = false;
            for (const { x0, x1, y0, y1 } of selected) {
                if (
                    x0 !== undefined &&
                    y0 !== undefined &&
                    x1 !== undefined &&
                    y1 !== undefined
                ) {
                    if (y0 <= meta.y && meta.y <= y1) {
                        datagrid.model._selection_state.dirty = true;
                        rendered = true;
                        td.classList.add(className);
                    }
                }
            }

            if (!rendered) {
                td.classList.remove(className);
            }
        }
    } else if (
        datagrid.model._edit_mode === "SELECT_COLUMN" &&
        selected.length > 0
    ) {
        const tds = table.querySelectorAll("tbody td");

        for (const td of tds) {
            const meta = table.getMeta(td);
            let rendered = false;
            for (const { x0, x1, y0, y1 } of selected) {
                if (
                    x0 !== undefined &&
                    y0 !== undefined &&
                    x1 !== undefined &&
                    y1 !== undefined
                ) {
                    if (x0 <= meta.x && meta.x <= x1) {
                        datagrid.model._selection_state.dirty = true;
                        rendered = true;
                        td.classList.add(className);
                    }
                }
            }

            if (!rendered) {
                td.classList.remove(className);
            }
        }
    }
};
