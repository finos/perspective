import React, { useEffect } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import CodeBlock from "@theme/CodeBlock";
import useBaseUrl from "@docusaurus/useBaseUrl";
import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";

function getQueryVariable(variable) {
    const params = new URL(document.location).searchParams;
    return params.get(variable);
}

export default function Block() {
    const { siteConfig } = useDocusaurusContext();
    let files = [];
    let example;
    if (ExecutionEnvironment.canUseDOM) {
        useEffect(() => {
            document.body.classList.add("scrolled");
        }, []);

        example = getQueryVariable("example");
        if (!example) {
            return (
                <Layout
                    title={`${siteConfig.title}`}
                    description={siteConfig.description}
                ></Layout>
            );
        }

        files = siteConfig.customFields.examples
            .find((x) => x.name === example)
            .files.filter((x) => !x.name.endsWith("png"));
    }

    const url = useBaseUrl(`/blocks/${example}/index.html`);

    return (
        <Layout
            title={`${siteConfig.title}`}
            description={siteConfig.description}
        >
            <div
                style={{
                    width: "960px",
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "stretch",
                        flexDirection: "column",
                    }}
                >
                    <br />
                    <h1>{example}</h1>
                    <BrowserOnly>
                        {() => (
                            <>
                                <iframe
                                    width="960"
                                    height="500"
                                    style={{
                                        border: "1px solid var(--ifm-toc-border-color)",
                                        borderRadius: "10px",
                                    }}
                                    src={url}
                                ></iframe>
                                <br />
                                <Link
                                    to={`pathname:///blocks/${example}/index.html`}
                                    style={{ alignSelf: "flex-end" }}
                                >
                                    {"Open in New Tab"}
                                </Link>
                                <br />

                                {files.map((x, i) => {
                                    const ext = x.name.split(".")[1];
                                    return (
                                        <CodeBlock
                                            key={i}
                                            language={ext}
                                            title={x.name}
                                            showLineNumbers
                                        >
                                            {x.contents}
                                        </CodeBlock>
                                    );
                                })}
                            </>
                        )}
                    </BrowserOnly>
                </div>
            </div>
        </Layout>
    );
}
