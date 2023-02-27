import React, { useCallback, useState, useRef } from "react";
import clsx from "clsx";
import { useColorMode } from "@docusaurus/theme-common";
import useBaseUrl from "@docusaurus/useBaseUrl";
import EXAMPLES from "./features.js";
import styles from "./styles.module.css";
import BrowserOnly from "@docusaurus/BrowserOnly";

const { convert } = require("@finos/perspective-viewer/src/ts/migrate");

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
    const { SUPERSTORE_TABLE } = require("@site/src/data/superstore.js");
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
            if (viewer !== null) {
                // console.log(
                //     convert({
                //         ...EXAMPLES.default[props.index].config,
                //         settings: true,
                //     })
                // );
                viewer.load(SUPERSTORE_TABLE);
                viewer.restore(
                    convert({
                        plugin: "Datagrid",
                        group_by: [],
                        expressions: [],
                        split_by: [],
                        sort: [],
                        aggregates: {},
                        ...EXAMPLES.default[props.index].config,
                        settings: true,
                    })
                );
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
                theme={props.color === "dark" ? "Pro Dark" : "Material Light"}
                class={clsx(styles.viewer)}
            ></perspective-viewer>
        </div>
    );
}
