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

import React, { useCallback, useState, useRef } from "react";
import clsx from "clsx";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import EXAMPLES from "./features.js";
import styles from "./styles.module.css";
import BrowserOnly from "@docusaurus/BrowserOnly";

export default function ExampleGallery(props) {
    const { colorMode } = useColorMode();
    const color = colorMode === "dark" ? "_dark" : "";
    const [overlayVisible, setOverlayVisible] = useState(-1);
    const closeOverlayCallback = useCallback(() => {
        setOverlayVisible(-1);
    }, [overlayVisible]);

    return (
        <>
            {EXAMPLES.default.map((config, i) => {
                const clickCallback = useCallback(() => {
                    setOverlayVisible(i);
                }, [overlayVisible]);

                return (
                    <img
                        className={clsx(
                            overlayVisible >= 0 ? styles.dimmed : undefined
                        )}
                        alt={config.description}
                        src={useBaseUrl(`/features/feature_${i}${color}.png`)}
                        key={i}
                        onClick={clickCallback}
                    />
                );
            })}
            {overlayVisible >= 0 ? (
                <BrowserOnly>
                    {() => {
                        return (
                            <OverlayDemo
                                index={overlayVisible}
                                color={colorMode}
                                onClose={closeOverlayCallback}
                            />
                        );
                    }}
                </BrowserOnly>
            ) : undefined}
        </>
    );
}

function OverlayDemo(props) {
    const ref = useRef();
    const dismissCallback = useCallback(
        (event) => {
            event.preventDefault();
            if (event.target === ref.current) {
                props.onClose();
            }
        },
        [props.onClose]
    );

    const perspectiveRef = useCallback(
        (viewer) => {
            const {
                SUPERSTORE_TABLE,
            } = require("@site/src/data/superstore.js");

            if (viewer !== null) {
                viewer.load(SUPERSTORE_TABLE);
                viewer.restore({
                    plugin: "Datagrid",
                    group_by: [],
                    expressions: {},
                    split_by: [],
                    sort: [],
                    aggregates: {},
                    ...EXAMPLES.default[props.index].config,
                    settings: true,
                });
            }
        },
        [props.index]
    );

    return (
        <div
            ref={ref}
            className={clsx(styles.overlay)}
            onClick={dismissCallback}
        >
            <perspective-viewer
                ref={perspectiveRef}
                theme={props.color === "dark" ? "Pro Dark" : "Pro Light"}
                class={clsx(styles.viewer)}
            ></perspective-viewer>
        </div>
    );
}
