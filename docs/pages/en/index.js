/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(process.cwd() + '/siteConfig.js');

function imgUrl(img) {
  return siteConfig.baseUrl + 'img/' + img;
}

function docUrl(doc, language) {
  return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc;
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? language + '/' : '') + page;
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: '_self',
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
    <small>Streaming Analytics <i>via</i> WebAssembly</small>
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
    let language = this.props.language || '';
    return (
      <SplashContainer>
        {/* <Logo img_src={imgUrl('docusaurus.svg')} /> */}
        <div className="inner">
          <ProjectTitle />
          <perspective-viewer class="titleViewer">
          </perspective-viewer>

          <PromoSection>
            <Button href="https://jsfiddle.net/user/texodus/fiddles/">Examples</Button>
            <Button href="https://jpmorganchase.github.io/perspective/docs/installation.html">Docs</Button>
            <Button href="https://www.npmjs.com/package/@jpmorganchase/perspective">NPM</Button>
            <Button href="https://github.com/jpmorganchase/perspective">Github</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

const Block = props => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}>
    <GridBlock align="center" contents={props.children} layout={props.layout} />
  </Container>
);

const Features = props => (
  <Block layout="fourColumn">
    {[
      {
        content: 'Quickly answer any question about your data through a set of flexible transforms, such as pivots, filters, and aggregations',
        image: imgUrl('baseline-settings-20px.svg'),
        imageAlign: 'top',
        title: 'Simple',
      },
      {
        content: 'Utilizing bleeding-edge browser technology such as Web Assembly and Apache Arrow, Perspective is unmatched in browser performance',
        image: imgUrl('baseline-trending_up-24px.svg'),
        imageAlign: 'top',
        title: 'Powerful',
      },
      {
        content: 'Engineered for reliability and production-vetted on the J.P. Morgan trading floor, now available to the development community as Open Source',
        image: imgUrl('baseline-security-24px.svg'),
        imageAlign: 'top',
        title: 'Industrial',
      },
    ]}
  </Block>
);

const FeatureCallout = props => (
  <div
    className="productShowcaseSection paddingBottom"
    style={{textAlign: 'center'}}>
    <h2>Features</h2>
    <MarkdownBlock background="dark">
A fast, memory efficient streaming pivot engine written principally in C++ and
compiled to both WebAssembly and asm.js via the
[emscripten](https://github.com/kripken/emscripten) compiler.
    </MarkdownBlock>
    <MarkdownBlock>
An embeddable, framework-agnostic configuration UI, based
on [Web Components](https://www.webcomponents.org/), and a WebWorker engine 
host for responsiveness at high frequency.
    </MarkdownBlock>
    <MarkdownBlock>
A suite of simple visualization plugins for some common Javascript libraries such as
[HighCharts](https://github.com/highcharts/highcharts) and 
[Hypergrid](https://github.com/fin-hypergrid/core).
    </MarkdownBlock>
    <MarkdownBlock>
Runtimes for the Browser and Node.js.
    </MarkdownBlock>
  </div>
);

const LearnHow = props => (
  <Block background="light">
    {[
      {
        content: 'Talk about learning how to use this',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'right',
        title: 'Learn How',
      },
    ]}
  </Block>
);

const TryOut = props => (
  <Block id="try">
    {[
      {
        content: 'Talk about trying this out',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'left',
        title: 'Try it Out',
      },
    ]}
  </Block>
);

const Description = props => (
  <Block background="dark">
    {[
      {
     //   content: 'We created Perspective to help our users answer questions about their <i>data</i>, without relying on chart settings, style options, or tedious configuration.',
       // image: imgUrl('2018-10-01-v0.2.0-release/hierarchial.png'),
        imageAlign: 'right',
       // title: 'Ask Your Data',
      },
    ]}
  </Block>
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
        <a className="button" href={pageUrl('users.html', props.language)}>
          More {siteConfig.title} Users
        </a>
      </div>
    </div>
  );
};

class Index extends React.Component {
  render() {
    let language = this.props.language || '';

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Features />
          {/* <Description />  */}
          <FeatureCallout />
          {/* <FeatureCallout />
          <LearnHow />
          <TryOut />
          */}
          {/* <Showcase language={language} /> */}
        </div>
      </div>
    );
  }
}

module.exports = Index;
