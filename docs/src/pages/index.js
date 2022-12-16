import React, { useEffect, useCallback } from "react";
import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useColorMode } from "@docusaurus/theme-common";
import Layout from "@theme/Layout";
import BrowserOnly from "@docusaurus/BrowserOnly";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import styles from "./index.module.css";

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    console.log(siteConfig);
    const { colorMode, setColorMode } = useColorMode();
    return (
        <header className={clsx("hero", styles.heroBanner)}>
            <div className="container">
                <img className={clsx(styles.heroBannerLogo)}></img>
                <div className={styles.buttons}>
                    <BrowserOnly>
                        {() => {
                            const {
                                PerspectiveViewerDemo,
                            } = require("@site/src/components/Demo");
                            return <PerspectiveViewerDemo />;
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
            const contains = document.body.classList.contains("scrolled");
            if (document.documentElement.scrollTop > 100 && !contains) {
                document.body.classList.add("scrolled");
            } else if (document.documentElement.scrollTop <= 100 && contains) {
                document.body.classList.remove("scrolled");
            }
        }, []);

        // Attach the scroll listener to the div
        useEffect(() => {
            document.addEventListener("scroll", handleScroll);
            return () => document.removeEventListener("scroll", handleScroll);
        }, [handleScroll]);
    }

    return (
        <Layout
            title={`${siteConfig.title}`}
            description={siteConfig.description}
        >
            <HomepageHeader />
            <main>
                <HomepageFeatures />
            </main>
        </Layout>
    );
}
