/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;
const classNames = require("classnames");

const siteConfig = require(process.cwd() + "/siteConfig.js");

function imgUrl(img) {
    return siteConfig.baseUrl + "img/" + img;
}

function docUrl(doc, language) {
    return siteConfig.baseUrl + "docs/" + (language ? language + "/" : "") + doc;
}

function pageUrl(page, language) {
    return siteConfig.baseUrl + (language ? language + "/" : "") + page;
}

class Button extends React.Component {
    render() {
        return (
            <div id={this.props.id} className="pluginWrapper buttonWrapper">
                <a className="button">{this.props.children}</a>
            </div>
        );
    }
}

Button.defaultProps = {
    target: "_self"
};

const SplashContainer = props => (
    <div className="homeContainer">
        <div className="homeSplashFade">
            <div className="wrapper homeWrapper">{props.children}</div>
        </div>
    </div>
);

const Logo = props => (
    <div className="projectLogo">
        <img src={props.img_src} />
    </div>
);

const ProjectTitle = props => (
    <h2 className="projectTitle">
        <perspective-logo />
        <small>
            Streaming Analytics <i>via</i> WebAssembly
        </small>
    </h2>
);

const PromoSection = props => (
    <div className="section promoSection">
        <div className="promoRow">
            <div className="pluginRowBlock">{props.children}</div>
        </div>
    </div>
);

class HomeSplash extends React.Component {
    render() {
        let language = this.props.language || "";
        return (
            <SplashContainer>
                <div className="inner">
                    <ProjectTitle />
                    <perspective-viewer class="titleViewer" />

                    <PromoSection>
                        <Button id="grid">Datagrid</Button>
                        <Button id="cyclone">X Bar</Button>
                        <Button id="enhance">Y Line</Button>
                        <Button id="crosssect">XY Scatter</Button>
                        <Button id="intersect">Treemap</Button>
                        <Button id="pivot">Heatmap</Button>
                    </PromoSection>
                </div>
            </SplashContainer>
        );
    }
}

const Block = props => (
    <Container padding={["bottom", "top"]} id={props.id} background={props.background}>
        <GridBlock contents={props.children} layout={props.layout} />
    </Container>
);

const PerspectiveBlock = props => {
    const block = props.children[0];
    let beforeImage, afterImage;
    if (block.imageAlign === "right") {
        afterImage = (
            <div className="blockImage">
                <perspective-viewer />
            </div>
        );
    } else {
        beforeImage = (
            <div className="blockImage">
                <perspective-viewer />
            </div>
        );
    }
    return (
        <Container padding={["bottom", "top"]} id={props.id} background={props.background}>
            <div
                className={classNames({
                    imageAlignRight: !!afterImage,
                    imageAlignLeft: !!beforeImage,
                    imageAlignSide: true
                })}
                key={block.title}
            >
                {beforeImage}
                <div className="blockContent">
                    <h2>
                        <MarkdownBlock>{block.title}</MarkdownBlock>
                    </h2>
                    <MarkdownBlock>{block.content}</MarkdownBlock>
                </div>
                {afterImage}
            </div>
        </Container>
    );
};

const Features = props => (
    <Block layout="fourColumn">
        {[
            {
                content: "Quickly answer any question about your data through a set of flexible transforms, such as pivots, filters, and aggregations",
                image: imgUrl("baseline-settings-20px.svg"),
                imageAlign: "top",
                title: "Simple"
            },
            {
                content: "Utilizing bleeding-edge browser technology such as Web Assembly and Apache Arrow, Perspective is unmatched in browser performance",
                image: imgUrl("baseline-trending_up-24px.svg"),
                imageAlign: "top",
                title: "Powerful"
            },
            {
                content: "Engineered for reliability and production-vetted on the J.P. Morgan trading floor, now available to the development community as Open Source",
                image: imgUrl("baseline-security-24px.svg"),
                imageAlign: "top",
                title: "Industrial"
            }
        ]}
    </Block>
);

const FeatureCallout = props => (
    <Container padding={["bottom", "top"]} background="dark">
        <h2>Features</h2>
        <MarkdownBlock background="dark">
            A fast, memory efficient streaming pivot engine written principally in C++ and compiled to WebAssembly via the [emscripten](https://github.com/kripken/emscripten) compiler.
        </MarkdownBlock>
        <MarkdownBlock>
            An embeddable, framework-agnostic configuration UI, based on [Web Components](https://www.webcomponents.org/), and a WebWorker engine host for responsiveness at high frequency.
        </MarkdownBlock>
        <MarkdownBlock>A customizable HTML Data Grid plugin, and a Charts plugin built on [D3FC](https://d3fc.io/).</MarkdownBlock>
        <MarkdownBlock>Integration with Jupyterlab, both natively in a Python kernel, and as a notebook Widget.</MarkdownBlock>
        <MarkdownBlock>Cross-language streaming & virtualization to the browser via [Apache Arrow](https://arrow.apache.org/).</MarkdownBlock>
        <MarkdownBlock>Runtimes for the browser, Python, and Node.js.</MarkdownBlock>
    </Container>
);

const DESCRIPTION_TEXT = `
# What is Perspective?
Perspective is an <i>interactive</i> visualization component for <i>large</i>, <i>real-time</i>
datasets. Originally developed for J.P. Morgan's trading business,  Perspective
makes it simple to build real-time & user configurable analytics entirely in the
browser, or in concert with Python and/or
[Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/).
Use it to create reports, dashboards, notebooks and applications, with static
data or streaming updates via [Apache Arrow](https://arrow.apache.org/).
- A fast, memory efficient streaming query engine, written in C++ and compiled to [WebAssembly](https://webassembly.org/), with read/write/stream support for [Apache Arrow]().
- A framework-agnostic query configuration UI component, based on [Web Components](https://www.webcomponents.org/), and a WebWorker and/or WebSocket data engine host for stable interactivity at high frequency.
- A customizable HTML Data Grid plugin, and a Chart plugin built on [D3FC](https://d3fc.io/).
- Integration with [Jupyterlab](https://jupyterlab.readthedocs.io/en/stable/), both natively in a Python kernel, and as a notebook Widget.
- Cross-language streaming and/or virtualization to the browser via [Apache Arrow](https://arrow.apache.org/).
- Runtimes for the browser, Python, and Node.js.
`;

const Description = props => (
    <PerspectiveBlock background="dark" id="demo1">
        {[
            {
                content: DESCRIPTION_TEXT,
                imageAlign: "right"
            }
        ]}
    </PerspectiveBlock>
);

const GETTING_STARTED_TEXT = `
# Get Started
1. Add \`@finos/perspective-cli\` to your project:
\`\`\`bash
$ yarn add --dev @finos/perspective-cli
\`\`\`
2. Run a test server on a CSV, JSON or [Apache Arrow](https://arrow.apache.org/):
\`\`\`bash
$ yarn perspective host < superstore.arrow
Listening on port 8080
\`\`\`

`;

const GetStarted = props => (
    <PerspectiveBlock id="get_started">
        {[
            {
                content: GETTING_STARTED_TEXT,
                image: imgUrl("2018-10-01-v0.2.0-release/theme.png"),
                imageAlign: "left"
            }
        ]}
    </PerspectiveBlock>
    // <Container padding={["bottom", "top"]} id="get_started">
    //     <MarkdownBlock>{GETTING_STARTED_TEXT}</MarkdownBlock>
    // </Container>
);

const Showcase = props => {
    if ((siteConfig.users || []).length === 0) {
        return null;
    }
    const showcase = siteConfig.users
        .filter(user => {
            return user.pinned;
        })
        .map((user, i) => {
            return (
                <a href={user.infoLink} key={i}>
                    <img src={user.image} alt={user.caption} title={user.caption} />
                </a>
            );
        });

    return (
        <div className="productShowcaseSection paddingBottom">
            <h2>{""}</h2>
            <div className="logos">{showcase}</div>
        </div>
    );
};

class Index extends React.Component {
    render() {
        let language = this.props.language || "";

        return (
            <div>
                <HomeSplash language={language} />
                <Description />
                <GetStarted />
            </div>
        );
    }
}

module.exports = Index;
