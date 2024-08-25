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

import React, { useEffect, useCallback, useState } from "react";
import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useColorMode } from "@docusaurus/theme-common";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import styles from "./index.module.css";
import { PerspectiveViewerDemo } from "../components/Demo";

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();

    const [perspective, setPerspective] = useState(null);

    useEffect(() => {
        Promise.all([
            import("@site/src/data/worker.js"),
            import("@finos/perspective-viewer"),
            import("@finos/perspective-viewer-datagrid"),
            import("@finos/perspective-viewer-d3fc"),
        ]).then(setPerspective);
    }, []);

    // const { colorMode, setColorMode } = useColorMode();
    return (
        <header className={clsx("hero", styles.heroBanner)}>
            <div className="container">
                {/* <img className={clsx(styles.heroBannerLogo)}></img> */}
                <div className={styles.buttons}>
                    <BrowserOnly>
                        {() => {
                            return (
                                <PerspectiveViewerDemo
                                    perspective={perspective?.[0]}
                                />
                            );
                        }}
                    </BrowserOnly>
                </div>
            </div>
        </header>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    if (ExecutionEnvironment.canUseDOM) {
        // The scroll listener
        const handleScroll = useCallback(() => {
            const elem = document.querySelector(".header-center");
            const contains = elem.classList.contains("header-shift");
            if (document.documentElement.scrollTop > 90 && contains) {
                elem.classList.remove("header-shift");
            } else if (document.documentElement.scrollTop <= 90 && !contains) {
                elem.classList.add("header-shift");
            }
        }, []);

        // Attach the scroll listener to the div
        useEffect(() => {
            const elem = document.querySelector(".header-center");
            elem.classList.add("header-shift");
            document.addEventListener("scroll", handleScroll);
            return () => document.removeEventListener("scroll", handleScroll);
        }, [handleScroll]);
    }

    return (
        <div className="header-center header-shift">
            <Layout
                title={`${siteConfig.title}`}
                description={siteConfig.description}
            >
                <HomepageHeader />
                <main>
                    <HomepageFeatures />
                </main>
            </Layout>
        </div>
    );
}
