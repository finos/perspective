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

import React, { useEffect } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import Link from "@docusaurus/Link";
import { get_examples } from "blocks/examples.js";

function partition(input, spacing) {
    let output = [];
    for (let i = 0; i < input.length; i += spacing) {
        output[output.length] = input.slice(i, i + spacing);
    }

    return output;
}

function ExampleTD({ img, url, item }) {
    return (
        <td style={{ maxWidth: "400px" }}>
            <Link to={url}>
                <br />
                <h4>{item}</h4>
                <img
                    width="100%"
                    src={img}
                    style={{
                        borderRadius: "10px",
                        border: "1px solid var(--ifm-toc-border-color)",
                    }}
                ></img>
            </Link>
        </td>
    );
}

function ExampleTR({ group }) {
    return (
        <tr>
            {group.map(({ img, name, url }) => {
                return (
                    <ExampleTD
                        key={name}
                        img={img}
                        url={url}
                        item={name}
                    ></ExampleTD>
                );
            })}
        </tr>
    );
}

function ExampleTable({ data }) {
    return (
        <table
            style={{
                display: "flex",
                margin: "0 auto",
                width: "600px",
                maxWidth: "90%",
            }}
        >
            <tbody>
                {partition(data, 2).map((x, i) => {
                    return <ExampleTR key={i} group={x}></ExampleTR>;
                })}
            </tbody>
        </table>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    const gists = get_examples(siteConfig.baseUrl);

    return (
        <div className="header-center">
            <Layout
                title={`${siteConfig.title}`}
                description={siteConfig.description}
            >
                <br />
                <ExampleTable data={gists} />
                <br />
                <br />
            </Layout>
        </div>
    );
}
