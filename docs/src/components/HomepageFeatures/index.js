import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";
import ExampleGallery from "@site/src/components/ExampleGallery";
import BrowserOnly from "@docusaurus/BrowserOnly";
// import YoutubeBlock from "@site/src/components/YouTubeBlock";

import ProjectDescription from "./description.md";
import JavaScriptDescription from "./javascript.md";
import PythonDescription from "./python.md";

const FeatureList = [
    {
        description: <ProjectDescription />,
    },
    {
        description: <JavaScriptDescription />,
    },
    {
        description: <PythonDescription />,
    },
];

function Feature({description}) {
    return (
        <div className={clsx("col col--4")}>
            <div className="text--full padding-horiz--md">{description}</div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <>
            <section className={styles.features}>
                <div className="container">
                    <div className="row">
                        {FeatureList.map((props, idx) => (
                            <Feature key={idx} {...props} />
                        ))}
                    </div>
                </div>
            </section>
            {/* <section className={styles.features}>
                <MediaAppearances />
            </section> */}
            <section className={clsx(styles.gallerySection, styles.features)}>
                <div className={clsx(styles.gallery, "container")}>
                    <BrowserOnly>{() => <ExampleGallery />}</BrowserOnly>
                </div>
            </section>
        </>
    );
}

function MediaAppearances(props) {
    return (
        <div className="container">
            <div className="row">
                <YoutubeBlock
                    id="demo1"
                    title="Jupytercon Demo"
                    className={clsx("col col--4")}
                    url="https://www.youtube.com/embed/IO-HJsGdleE?&theme=dark&autohide=1&modestbranding=1&showinfo=0&rel=0"
                />
                <YoutubeBlock
                    id="demo2"
                    title="Jupytercon Demo"
                    className={clsx("col col--4")}
                    url="https://www.youtube.com/embed/no0qChjvdgQ?&theme=dark&autohide=1&modestbranding=1&showinfo=0&rel=0"
                />
            </div>
        </div>
    );
}
