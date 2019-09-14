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
        {siteConfig.title}
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
                        <Button id="grid">Slice</Button>
                        <Button id="cyclone">Dice</Button>
                        <Button id="enhance">Pivot</Button>
                        <Button id="crosssect">Crosssect</Button>
                        <Button id="intersect">Retrospect</Button>
                        <Button id="pivot">Enhance</Button>
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
            <div className={classNames({imageAlignRight: !!afterImage, imageAlignLeft: !!beforeImage, imageAlignSide: true})} key={block.title}>
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
        <MarkdownBlock>
            A suite of simple visualization plugins for some common Javascript libraries such as [D3FC](), [Hypergrid](https://github.com/fin-hypergrid/core) and
            [HighCharts](https://github.com/highcharts/highcharts).
        </MarkdownBlock>
        <MarkdownBlock>Integration with Jupyterlab.</MarkdownBlock>
        <MarkdownBlock>Runtimes for the Browser and Node.js.</MarkdownBlock>
    </Container>
);

const DESCRIPTION_TEXT = `
# What is Perspective?
Originally developed for J.P. Morgan's trading business, Perspective is
an <i>interactive</i> visualization component for <i>large</i>, <i>real-time</i>
datasets.  Use it to build reports, dashboards, notebooks and applications.
Perspective comes with:
* A fast, memory efficient streaming query engine, written in C++ and compiled to [WebAssembly](), with read/write/stream support for [Apache Arrow]().
* A framework-agnostic query configuration UI component, based on [Web Components](https://www.webcomponents.org/), and a WebWorker and/or WebSocket data engine host for stable interactivity at high frequency.
* A suite of simple, context-aware visualization plugins for some common Javascript libraries such as [D3FC](https://d3fc.io/) and [Hypergrid](https://github.com/fin-hypergrid/core).
* Integration with [Jupyterlab](), Runtimes for the Browser and Node.js.
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
2. Run a test server on a CSV, JSON or [Apache Arrow]():
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
            <h2>{"Who's Using This?"}</h2>
            <p>This project is used by all these people</p>
            <div className="logos">{showcase}</div>
            <div className="more-users">
                <a className="button" href={pageUrl("users.html", props.language)}>
                    More {siteConfig.title} Users
                </a>
            </div>
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
