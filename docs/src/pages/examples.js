import React, { useEffect, useCallback } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
// import gists from "../../../examples/blocks/gists.json";
import useBaseUrl from "@docusaurus/useBaseUrl";
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
                    style={{ borderRadius: "10px" }}
                ></img>
            </Link>
        </td>
    );
}

function ExampleTR({ group }) {
    return (
        <tr>
            {group.map(({ img, name, url }) => {
                // const img = useBaseUrl(`/blocks/${item}/preview.png`);
                // const url = useBaseUrl(`/block?example=${item}`);
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
                width: "1200px",
                maxWidth: "90%",
            }}
        >
            <tbody>
                {/* <tr>
                    <ExampleTD
                        key="magic"
                        img={useBaseUrl("/img/mtg_preview.png")}
                        url="https://texodus.github.io/mtg-perspective/?seasons-in-the-abyss-67"
                        item="magic"
                    ></ExampleTD>
                    <ExampleTD
                        key="nft"
                        img="https://raw.githubusercontent.com/sc1f/pudgy-penguin-perspective/pages/meta.png"
                        url="https://sc1f.github.io/pudgy-penguin-perspective/"
                        item="nft"
                    ></ExampleTD>
                    <ExampleTD
                        key="nypd ccrb"
                        img="https://texodus.github.io/nypd-ccrb/preview.png"
                        url="https://texodus.github.io/nypd-ccrb/"
                        item="nypd ccrb"
                    ></ExampleTD>
                </tr> */}
                {partition(data, 3).map((x, i) => {
                    return <ExampleTR key={i} group={x}></ExampleTR>;
                })}
            </tbody>
        </table>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    const gists = get_examples(siteConfig.baseUrl);
    if (ExecutionEnvironment.canUseDOM) {
        useEffect(() => {
            document.body.classList.add("scrolled");
        }, []);
    }

    return (
        <Layout
            title={`${siteConfig.title}`}
            description={siteConfig.description}
        >
            <br />
            <ExampleTable data={gists} />
            <br />
        </Layout>
    );
}
