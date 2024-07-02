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

import { useColorMode } from "@docusaurus/theme-common";
import React, { useState, useCallback, useRef, useEffect } from "react";
import clsx from "clsx";
import BrowserOnly from "@docusaurus/BrowserOnly";

import { random_row } from "./data.js";
import { LAYOUTS } from "./layouts.js";
import styles from "./styles.module.css";

const IS_ROTATE = false;

let TABLE,
    VIEWER,
    FREQ = 100,
    REALTIME_PAUSED = true;

let total = 0;
let id = "sparkgrid";
let globalUseSelected;

async function lazy_load(colorMode, perspective, viewer) {
    if (TABLE === undefined) {
        TABLE = await start_streaming(perspective, viewer);
    }

    if (VIEWER !== undefined && VIEWER !== viewer) {
        VIEWER.delete();
        VIEWER = undefined;
    }

    if (VIEWER === undefined) {
        VIEWER = viewer;
        VIEWER.load(TABLE);
    }

    select(viewer, id, {
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

export function PerspectiveViewerDemo(props) {
    const { colorMode } = useColorMode();
    const [selected, setSelected] = useState(id);
    const [freq, setFreq] = useState(FREQ);
    const viewerRef = useRef();
    globalUseSelected = setSelected;
    const hoverCallback = useCallback(
        (event) => {
            total = 0;
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
        if (!props.perspective) {
            return;
        }

        REALTIME_PAUSED = false;
        lazy_load(colorMode, props.perspective, viewerRef.current);
        return () => {
            REALTIME_PAUSED = true;
        };
    }, [viewerRef, colorMode, props.perspective]);

    if (!props.perspective) {
        return false;
    }

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
                        : `${((1000 / freq) * 10).toFixed(0)} msg/s`}
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

function update(table, viewer) {
    if (!REALTIME_PAUSED && FREQ <= 189.9) {
        var viewport_height = document.documentElement.clientHeight;
        if (viewport_height - window.scrollY > 0) {
            let arr = new Array(10);
            for (let i = 0; i < 10; i++) {
                arr[i] = random_row();
            }

            table.update(arr);
        }
    }

    total += FREQ;
    if (total > 5000 && IS_ROTATE) {
        total = 0;
        const keys = Object.keys(LAYOUTS);
        const key = keys[(keys.indexOf(id) + 1) % keys.length];
        globalUseSelected(key);
        select(viewer, key);
    }

    setTimeout(() => update(table, viewer), FREQ);
}

function select(viewer, _id, extra = {}) {
    id = _id;
    viewer.restore({ ...LAYOUTS[id], ...extra });
}

async function start_streaming(perspective, viewer) {
    var data = [];
    for (var x = 0; x < 1000; x++) {
        data.push(random_row());
    }

    const worker = await perspective.worker();
    var tbl = worker.table(data, { index: "id" });
    setTimeout(async function () {
        let table = await tbl;
        update(table, viewer);
    });

    return tbl;
}
