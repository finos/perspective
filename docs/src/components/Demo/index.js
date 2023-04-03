import perspective from "@finos/perspective";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import { useColorMode } from "@docusaurus/theme-common";
import React, { useState, useCallback, useRef, useEffect } from "react";
import clsx from "clsx";
import BrowserOnly from "@docusaurus/BrowserOnly";

import { random_row } from "./data.js";
import { LAYOUTS } from "./layouts.js";
import styles from "./styles.module.css";

const WORKER = perspective.shared_worker();

let TABLE,
    VIEWER,
    FREQ = 100,
    REALTIME_PAUSED = true;

async function lazy_load(colorMode, viewer) {
    if (TABLE === undefined) {
        TABLE = await start_streaming();
    }

    if (VIEWER !== undefined && VIEWER !== viewer) {
        VIEWER.delete();
        VIEWER = undefined;
    }

    if (VIEWER === undefined) {
        VIEWER = viewer;
        VIEWER.load(TABLE);
    }

    select(viewer, "sparkgrid", {
        theme: colorMode === "dark" ? "Pro Dark" : "Pro Light",
    });
}

function LayoutButton(props) {
    let active;
    if (props.name === props.selected) {
        active = styles.visButtonActive;
    }

    return (
        <div
            onMouseOver={props.onHover}
            className={clsx(styles.visButton, active)}
            id={props.name}
        >
            {props.name}
        </div>
    );
}

export function PerspectiveViewerDemo() {
    const { colorMode } = useColorMode();
    const [selected, setSelected] = useState("sparkgrid");
    const [freq, setFreq] = useState(FREQ);
    const viewerRef = useRef();
    const hoverCallback = useCallback(
        (event) => {
            setSelected(event.target.getAttribute("id"));
            select(viewerRef.current, `${event.target.getAttribute("id")}`);
        },
        [viewerRef]
    );

    const freqCallback = useCallback(
        (event) => {
            FREQ = (-9 / 5) * event.target.value + 190;
            setFreq(FREQ);
        },
        [freq]
    );

    useEffect(() => {
        REALTIME_PAUSED = false;
        lazy_load(colorMode, viewerRef.current);
        return () => {
            REALTIME_PAUSED = true;
        };
    }, [viewerRef, colorMode]);

    return (
        <div className={clsx(styles.container)}>
            <perspective-viewer
                ref={viewerRef}
                class={clsx("nosuperstore", styles.heroBannerViewer)}
            ></perspective-viewer>
            <div className={clsx(styles.visButtons)}>
                <BrowserOnly>
                    {() =>
                        Object.keys(LAYOUTS).map((key) => {
                            return (
                                <LayoutButton
                                    name={key}
                                    id={key}
                                    key={key}
                                    selected={selected}
                                    onHover={hoverCallback}
                                />
                            );
                        })
                    }
                </BrowserOnly>
            </div>
            <div id="timecontrols" class={clsx(styles.timecontrols)}>
                <span>
                    {freq >= 189
                        ? "paused"
                        : `${((1000 / freq) * 3).toFixed(0)} msg/s`}
                </span>
                <input
                    id="velocity"
                    aria-label="Demo update rate in messages per second"
                    type="range"
                    className={clsx(styles.freqSlider)}
                    defaultValue={Math.round((freq - 190) * (5 / -9))}
                    onInput={freqCallback}
                ></input>
            </div>
        </div>
    );
}

function update(table) {
    if (!REALTIME_PAUSED && FREQ <= 189.9) {
        var viewport_height = document.documentElement.clientHeight;
        if (viewport_height - window.scrollY > 0) {
            table.update([random_row(), random_row(), random_row()]);
        }
    }

    setTimeout(() => update(table), FREQ);
}

function select(viewer, id, extra = {}) {
    viewer.restore({ ...LAYOUTS[id], ...extra });
}

async function start_streaming() {
    var data = [];
    for (var x = 0; x < 1000; x++) {
        data.push(random_row());
    }

    var tbl = WORKER.table(data, { index: "id" });
    setTimeout(async function () {
        let table = await tbl;
        update(table, 0);
    });

    return tbl;
}
