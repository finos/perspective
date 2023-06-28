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

import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";
import ExampleGallery from "@site/src/components/ExampleGallery";
import BrowserOnly from "@docusaurus/BrowserOnly";
// import YoutubeBlock from "@site/src/components/YouTubeBlock";

import ProjectDescription from "./description.md";
import JavaScriptDescription from "./javascript.md";
import PythonDescription from "./python.md";

import Feature1 from "./feature1.md";
import Feature2 from "./feature2.md";
import Feature3 from "./feature3.md";

import Svg1 from "@site/static/svg/feature1.svg";
import Svg2 from "@site/static/svg/feature2.svg";
import Svg3 from "@site/static/svg/feature3.svg";

const FeatureList = [
    {
        description: (
            <div>
                <ProjectDescription />
                <br />
                <h3>Features</h3>
                <br />
                <div className={styles.feature}>
                    <Svg1 className={styles.featureSvg}></Svg1>
                    <Feature1></Feature1>
                </div>
                <div className={styles.feature}>
                    <Svg2 className={styles.featureSvg}></Svg2>
                    <Feature2></Feature2>
                </div>
                <div className={styles.feature}>
                    <Svg3 className={styles.featureSvg}></Svg3>
                    <Feature3></Feature3>
                </div>
            </div>
        ),
    },
    {
        description: <JavaScriptDescription />,
    },
    {
        description: <PythonDescription />,
    },
];

function Feature({ description }) {
    return (
        <div className={clsx()}>
            <div className="text--full padding-horiz--md">{description}</div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <>
            <section className={styles.features}>
                <div className={styles.container}>
                    <div className="row">
                        {FeatureList.map((props, idx) => (
                            <>
                                <hr></hr>
                                <br />
                                <br />
                                <br />
                                <Feature key={idx} {...props} />
                            </>
                        ))}
                    </div>
                    <br />
                    <hr></hr>
                </div>
            </section>

            <section className={clsx(styles.gallerySection, styles.features)}>
                <div className={clsx(styles.gallery, "container")}>
                    <BrowserOnly>{() => <ExampleGallery />}</BrowserOnly>
                    <hr></hr>
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
