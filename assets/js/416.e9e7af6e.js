(self.webpackChunk_finos_perspective_docs=self.webpackChunk_finos_perspective_docs||[]).push([[416],{4416:(e,n,t)=>{t.d(n,{A:()=>bn});var s=t(7378),i=t(3843),a=t(4012),o=t(6106);const l=s.createContext(null);function r(e){let{children:n,content:t}=e;const i=function(e){return(0,s.useMemo)((()=>({metadata:e.metadata,frontMatter:e.frontMatter,assets:e.assets,contentTitle:e.contentTitle,toc:e.toc})),[e])}(t);return(0,o.jsx)(l.Provider,{value:i,children:n})}function c(){const e=(0,s.useContext)(l);if(null===e)throw new a.dV("DocProvider");return e}function d(){const{metadata:e,frontMatter:n,assets:t}=c();return(0,o.jsx)(i.be,{title:e.title,description:e.description,keywords:n.keywords,image:t.image??n.image})}var u=t(3372),m=t(1605),h=t(5076),x=t(9484);function p(e){const{permalink:n,title:t,subLabel:s,isNext:i}=e;return(0,o.jsxs)(x.A,{className:(0,u.A)("pagination-nav__link",i?"pagination-nav__link--next":"pagination-nav__link--prev"),to:n,children:[s&&(0,o.jsx)("div",{className:"pagination-nav__sublabel",children:s}),(0,o.jsx)("div",{className:"pagination-nav__label",children:t})]})}function f(e){const{previous:n,next:t}=e;return(0,o.jsxs)("nav",{className:"pagination-nav docusaurus-mt-lg","aria-label":(0,h.T)({id:"theme.docs.paginator.navAriaLabel",message:"Docs pages",description:"The ARIA label for the docs pagination"}),children:[n&&(0,o.jsx)(p,{...n,subLabel:(0,o.jsx)(h.A,{id:"theme.docs.paginator.previous",description:"The label used to navigate to the previous doc",children:"Previous"})}),t&&(0,o.jsx)(p,{...t,subLabel:(0,o.jsx)(h.A,{id:"theme.docs.paginator.next",description:"The label used to navigate to the next doc",children:"Next"}),isNext:!0})]})}function v(){const{metadata:e}=c();return(0,o.jsx)(f,{previous:e.previous,next:e.next})}var g=t(2964),j=t(8072),b=t(3335),N=t(957),A=t(4076);const C={unreleased:function(e){let{siteTitle:n,versionMetadata:t}=e;return(0,o.jsx)(h.A,{id:"theme.docs.versions.unreleasedVersionLabel",description:"The label used to tell the user that he's browsing an unreleased doc version",values:{siteTitle:n,versionLabel:(0,o.jsx)("b",{children:t.label})},children:"This is unreleased documentation for {siteTitle} {versionLabel} version."})},unmaintained:function(e){let{siteTitle:n,versionMetadata:t}=e;return(0,o.jsx)(h.A,{id:"theme.docs.versions.unmaintainedVersionLabel",description:"The label used to tell the user that he's browsing an unmaintained doc version",values:{siteTitle:n,versionLabel:(0,o.jsx)("b",{children:t.label})},children:"This is documentation for {siteTitle} {versionLabel}, which is no longer actively maintained."})}};function _(e){const n=C[e.versionMetadata.banner];return(0,o.jsx)(n,{...e})}function L(e){let{versionLabel:n,to:t,onClick:s}=e;return(0,o.jsx)(h.A,{id:"theme.docs.versions.latestVersionSuggestionLabel",description:"The label used to tell the user to check the latest version",values:{versionLabel:n,latestVersionLink:(0,o.jsx)("b",{children:(0,o.jsx)(x.A,{to:t,onClick:s,children:(0,o.jsx)(h.A,{id:"theme.docs.versions.latestVersionLinkLabel",description:"The label used for the latest version suggestion link label",children:"latest version"})})})},children:"For up-to-date documentation, see the {latestVersionLink} ({versionLabel})."})}function y(e){let{className:n,versionMetadata:t}=e;const{siteConfig:{title:s}}=(0,g.A)(),{pluginId:i}=(0,j.vT)({failfast:!0}),{savePreferredVersionName:a}=(0,N.g1)(i),{latestDocSuggestion:l,latestVersionSuggestion:r}=(0,j.HW)(i),c=l??(d=r).docs.find((e=>e.id===d.mainDocId));var d;return(0,o.jsxs)("div",{className:(0,u.A)(n,b.G.docs.docVersionBanner,"alert alert--warning margin-bottom--md"),role:"alert",children:[(0,o.jsx)("div",{children:(0,o.jsx)(_,{siteTitle:s,versionMetadata:t})}),(0,o.jsx)("div",{className:"margin-top--md",children:(0,o.jsx)(L,{versionLabel:r.label,to:c.path,onClick:()=>a(r.name)})})]})}function T(e){let{className:n}=e;const t=(0,A.r)();return t.banner?(0,o.jsx)(y,{className:n,versionMetadata:t}):null}function k(e){let{className:n}=e;const t=(0,A.r)();return t.badge?(0,o.jsx)("span",{className:(0,u.A)(n,b.G.docs.docVersionBadge,"badge badge--secondary"),children:(0,o.jsx)(h.A,{id:"theme.docs.versionBadge.label",values:{versionLabel:t.label},children:"Version: {versionLabel}"})}):null}const H={tag:"tag_jsG1",tagRegular:"tagRegular_G0hp",tagWithCount:"tagWithCount_W3SY"};function w(e){let{permalink:n,label:t,count:s,description:i}=e;return(0,o.jsxs)(x.A,{href:n,title:i,className:(0,u.A)(H.tag,s?H.tagWithCount:H.tagRegular),children:[t,s&&(0,o.jsx)("span",{children:s})]})}const M={tags:"tags_WWFx",tag:"tag_Ot7P"};function U(e){let{tags:n}=e;return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("b",{children:(0,o.jsx)(h.A,{id:"theme.tags.tagsListLabel",description:"The label alongside a tag list",children:"Tags:"})}),(0,o.jsx)("ul",{className:(0,u.A)(M.tags,"padding--none","margin-left--sm"),children:n.map((e=>(0,o.jsx)("li",{className:M.tag,children:(0,o.jsx)(w,{...e})},e.permalink)))})]})}const B={iconEdit:"iconEdit_IYU6"};function I(e){let{className:n,...t}=e;return(0,o.jsx)("svg",{fill:"currentColor",height:"20",width:"20",viewBox:"0 0 40 40",className:(0,u.A)(B.iconEdit,n),"aria-hidden":"true",...t,children:(0,o.jsx)("g",{children:(0,o.jsx)("path",{d:"m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"})})})}function E(e){let{editUrl:n}=e;return(0,o.jsxs)(x.A,{to:n,className:b.G.common.editThisPage,children:[(0,o.jsx)(I,{}),(0,o.jsx)(h.A,{id:"theme.common.editThisPage",description:"The link label to edit the current page",children:"Edit this page"})]})}function z(e){void 0===e&&(e={});const{i18n:{currentLocale:n}}=(0,g.A)(),t=function(){const{i18n:{currentLocale:e,localeConfigs:n}}=(0,g.A)();return n[e].calendar}();return new Intl.DateTimeFormat(n,{calendar:t,...e})}function R(e){let{lastUpdatedAt:n}=e;const t=new Date(n),s=z({day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(t);return(0,o.jsx)(h.A,{id:"theme.lastUpdated.atDate",description:"The words used to describe on which date a page has been last updated",values:{date:(0,o.jsx)("b",{children:(0,o.jsx)("time",{dateTime:t.toISOString(),itemProp:"dateModified",children:s})})},children:" on {date}"})}function S(e){let{lastUpdatedBy:n}=e;return(0,o.jsx)(h.A,{id:"theme.lastUpdated.byUser",description:"The words used to describe by who the page has been last updated",values:{user:(0,o.jsx)("b",{children:n})},children:" by {user}"})}function D(e){let{lastUpdatedAt:n,lastUpdatedBy:t}=e;return(0,o.jsxs)("span",{className:b.G.common.lastUpdated,children:[(0,o.jsx)(h.A,{id:"theme.lastUpdated.lastUpdatedAtBy",description:"The sentence used to display when a page has been last updated, and by who",values:{atDate:n?(0,o.jsx)(R,{lastUpdatedAt:n}):"",byUser:t?(0,o.jsx)(S,{lastUpdatedBy:t}):""},children:"Last updated{atDate}{byUser}"}),!1]})}const O={lastUpdated:"lastUpdated_FNBX"};function P(e){let{className:n,editUrl:t,lastUpdatedAt:s,lastUpdatedBy:i}=e;return(0,o.jsxs)("div",{className:(0,u.A)("row",n),children:[(0,o.jsx)("div",{className:"col",children:t&&(0,o.jsx)(E,{editUrl:t})}),(0,o.jsx)("div",{className:(0,u.A)("col",O.lastUpdated),children:(s||i)&&(0,o.jsx)(D,{lastUpdatedAt:s,lastUpdatedBy:i})})]})}function V(){const{metadata:e}=c(),{editUrl:n,lastUpdatedAt:t,lastUpdatedBy:s,tags:i}=e,a=i.length>0,l=!!(n||t||s);return a||l?(0,o.jsxs)("footer",{className:(0,u.A)(b.G.docs.docFooter,"docusaurus-mt-lg"),children:[a&&(0,o.jsx)("div",{className:(0,u.A)("row margin-top--sm",b.G.docs.docFooterTagsRow),children:(0,o.jsx)("div",{className:"col",children:(0,o.jsx)(U,{tags:i})})}),l&&(0,o.jsx)(P,{className:(0,u.A)("margin-top--sm",b.G.docs.docFooterEditMetaRow),editUrl:n,lastUpdatedAt:t,lastUpdatedBy:s})]}):null}var G=t(4030),F=t(4518);function W(e){const n=e.map((e=>({...e,parentIndex:-1,children:[]}))),t=Array(7).fill(-1);n.forEach(((e,n)=>{const s=t.slice(2,e.level);e.parentIndex=Math.max(...s),t[e.level]=n}));const s=[];return n.forEach((e=>{const{parentIndex:t,...i}=e;t>=0?n[t].children.push(i):s.push(i)})),s}function q(e){let{toc:n,minHeadingLevel:t,maxHeadingLevel:s}=e;return n.flatMap((e=>{const n=q({toc:e.children,minHeadingLevel:t,maxHeadingLevel:s});return function(e){return e.level>=t&&e.level<=s}(e)?[{...e,children:n}]:n}))}function $(e){const n=e.getBoundingClientRect();return n.top===n.bottom?$(e.parentNode):n}function Y(e,n){let{anchorTopOffset:t}=n;const s=e.find((e=>$(e).top>=t));if(s){return function(e){return e.top>0&&e.bottom<window.innerHeight/2}($(s))?s:e[e.indexOf(s)-1]??null}return e[e.length-1]??null}function Z(){const e=(0,s.useRef)(0),{navbar:{hideOnScroll:n}}=(0,F.p)();return(0,s.useEffect)((()=>{e.current=n?0:document.querySelector(".navbar").clientHeight}),[n]),e}function Q(e){const n=(0,s.useRef)(void 0),t=Z();(0,s.useEffect)((()=>{if(!e)return()=>{};const{linkClassName:s,linkActiveClassName:i,minHeadingLevel:a,maxHeadingLevel:o}=e;function l(){const e=function(e){return Array.from(document.getElementsByClassName(e))}(s),l=function(e){let{minHeadingLevel:n,maxHeadingLevel:t}=e;const s=[];for(let i=n;i<=t;i+=1)s.push(`h${i}.anchor`);return Array.from(document.querySelectorAll(s.join()))}({minHeadingLevel:a,maxHeadingLevel:o}),r=Y(l,{anchorTopOffset:t.current}),c=e.find((e=>r&&r.id===function(e){return decodeURIComponent(e.href.substring(e.href.indexOf("#")+1))}(e)));e.forEach((e=>{!function(e,t){t?(n.current&&n.current!==e&&n.current.classList.remove(i),e.classList.add(i),n.current=e):e.classList.remove(i)}(e,e===c)}))}return document.addEventListener("scroll",l),document.addEventListener("resize",l),l(),()=>{document.removeEventListener("scroll",l),document.removeEventListener("resize",l)}}),[e,t])}function X(e){let{toc:n,className:t,linkClassName:s,isChild:i}=e;return n.length?(0,o.jsx)("ul",{className:i?void 0:t,children:n.map((e=>(0,o.jsxs)("li",{children:[(0,o.jsx)(x.A,{to:`#${e.id}`,className:s??void 0,dangerouslySetInnerHTML:{__html:e.value}}),(0,o.jsx)(X,{isChild:!0,toc:e.children,className:t,linkClassName:s})]},e.id)))}):null}const J=s.memo(X);function K(e){let{toc:n,className:t="table-of-contents table-of-contents__left-border",linkClassName:i="table-of-contents__link",linkActiveClassName:a,minHeadingLevel:l,maxHeadingLevel:r,...c}=e;const d=(0,F.p)(),u=l??d.tableOfContents.minHeadingLevel,m=r??d.tableOfContents.maxHeadingLevel,h=function(e){let{toc:n,minHeadingLevel:t,maxHeadingLevel:i}=e;return(0,s.useMemo)((()=>q({toc:W(n),minHeadingLevel:t,maxHeadingLevel:i})),[n,t,i])}({toc:n,minHeadingLevel:u,maxHeadingLevel:m});return Q((0,s.useMemo)((()=>{if(i&&a)return{linkClassName:i,linkActiveClassName:a,minHeadingLevel:u,maxHeadingLevel:m}}),[i,a,u,m])),(0,o.jsx)(J,{toc:h,className:t,linkClassName:i,...c})}const ee={tocCollapsibleButton:"tocCollapsibleButton_e7NQ",tocCollapsibleButtonExpanded:"tocCollapsibleButtonExpanded_d9pr"};function ne(e){let{collapsed:n,...t}=e;return(0,o.jsx)("button",{type:"button",...t,className:(0,u.A)("clean-btn",ee.tocCollapsibleButton,!n&&ee.tocCollapsibleButtonExpanded,t.className),children:(0,o.jsx)(h.A,{id:"theme.TOCCollapsible.toggleButtonLabel",description:"The label used by the button on the collapsible TOC component",children:"On this page"})})}const te={tocCollapsible:"tocCollapsible_pWQg",tocCollapsibleContent:"tocCollapsibleContent_cy7U",tocCollapsibleExpanded:"tocCollapsibleExpanded_pe57"};function se(e){let{toc:n,className:t,minHeadingLevel:s,maxHeadingLevel:i}=e;const{collapsed:a,toggleCollapsed:l}=(0,G.u)({initialState:!0});return(0,o.jsxs)("div",{className:(0,u.A)(te.tocCollapsible,!a&&te.tocCollapsibleExpanded,t),children:[(0,o.jsx)(ne,{collapsed:a,onClick:l}),(0,o.jsx)(G.N,{lazy:!0,className:te.tocCollapsibleContent,collapsed:a,children:(0,o.jsx)(K,{toc:n,minHeadingLevel:s,maxHeadingLevel:i})})]})}const ie={tocMobile:"tocMobile_niuB"};function ae(){const{toc:e,frontMatter:n}=c();return(0,o.jsx)(se,{toc:e,minHeadingLevel:n.toc_min_heading_level,maxHeadingLevel:n.toc_max_heading_level,className:(0,u.A)(b.G.docs.docTocMobile,ie.tocMobile)})}const oe={tableOfContents:"tableOfContents_d_iq",docItemContainer:"docItemContainer_K8rg"},le="table-of-contents__link toc-highlight",re="table-of-contents__link--active";function ce(e){let{className:n,...t}=e;return(0,o.jsx)("div",{className:(0,u.A)(oe.tableOfContents,"thin-scrollbar",n),children:(0,o.jsx)(K,{...t,linkClassName:le,linkActiveClassName:re})})}function de(){const{toc:e,frontMatter:n}=c();return(0,o.jsx)(ce,{toc:e,minHeadingLevel:n.toc_min_heading_level,maxHeadingLevel:n.toc_max_heading_level,className:b.G.docs.docTocDesktop})}var ue=t(4615),me=t(9252),he=t(3386),xe=t(3021);function pe(e){return(0,o.jsx)("code",{...e})}var fe=t(518),ve=t(4509);const ge={details:"details_Nm0O",isBrowser:"isBrowser_mHCb",collapsibleContent:"collapsibleContent_DOTz"};function je(e){return!!e&&("SUMMARY"===e.tagName||je(e.parentElement))}function be(e,n){return!!e&&(e===n||be(e.parentElement,n))}function Ne(e){let{summary:n,children:t,...i}=e;(0,fe.A)().collectAnchor(i.id);const a=(0,ve.A)(),l=(0,s.useRef)(null),{collapsed:r,setCollapsed:c}=(0,G.u)({initialState:!i.open}),[d,m]=(0,s.useState)(i.open),h=s.isValidElement(n)?n:(0,o.jsx)("summary",{children:n??"Details"});return(0,o.jsxs)("details",{...i,ref:l,open:d,"data-collapsed":r,className:(0,u.A)(ge.details,a&&ge.isBrowser,i.className),onMouseDown:e=>{je(e.target)&&e.detail>1&&e.preventDefault()},onClick:e=>{e.stopPropagation();const n=e.target;je(n)&&be(n,l.current)&&(e.preventDefault(),r?(c(!1),m(!0)):c(!0))},children:[h,(0,o.jsx)(G.N,{lazy:!1,collapsed:r,disableSSRStyle:!0,onCollapseTransitionEnd:e=>{c(e),m(!e)},children:(0,o.jsx)("div",{className:ge.collapsibleContent,children:t})})]})}const Ae={details:"details_rt9h"},Ce="alert alert--info";function _e(e){let{...n}=e;return(0,o.jsx)(Ne,{...n,className:(0,u.A)(Ce,Ae.details,n.className)})}function Le(e){const n=s.Children.toArray(e.children),t=n.find((e=>s.isValidElement(e)&&"summary"===e.type)),i=(0,o.jsx)(o.Fragment,{children:n.filter((e=>e!==t))});return(0,o.jsx)(_e,{...e,summary:t,children:i})}function ye(e){return(0,o.jsx)(ue.A,{...e})}const Te={containsTaskList:"containsTaskList_zJIz"};function ke(e){if(void 0!==e)return(0,u.A)(e,e?.includes("contains-task-list")&&Te.containsTaskList)}const He={img:"img_Zh0_"};function we(e){const{mdxAdmonitionTitle:n,rest:t}=function(e){const n=s.Children.toArray(e),t=n.find((e=>s.isValidElement(e)&&"mdxAdmonitionTitle"===e.type)),i=n.filter((e=>e!==t)),a=t?.props.children;return{mdxAdmonitionTitle:a,rest:i.length>0?(0,o.jsx)(o.Fragment,{children:i}):null}}(e.children),i=e.title??n;return{...e,...i&&{title:i},children:t}}const Me={admonition:"admonition_GvjC",admonitionHeading:"admonitionHeading_w3Sy",admonitionIcon:"admonitionIcon_ULat",admonitionContent:"admonitionContent_xh_R"};function Ue(e){let{type:n,className:t,children:s}=e;return(0,o.jsx)("div",{className:(0,u.A)(b.G.common.admonition,b.G.common.admonitionType(n),Me.admonition,t),children:s})}function Be(e){let{icon:n,title:t}=e;return(0,o.jsxs)("div",{className:Me.admonitionHeading,children:[(0,o.jsx)("span",{className:Me.admonitionIcon,children:n}),t]})}function Ie(e){let{children:n}=e;return n?(0,o.jsx)("div",{className:Me.admonitionContent,children:n}):null}function Ee(e){const{type:n,icon:t,title:s,children:i,className:a}=e;return(0,o.jsxs)(Ue,{type:n,className:a,children:[s||t?(0,o.jsx)(Be,{title:s,icon:t}):null,(0,o.jsx)(Ie,{children:i})]})}function ze(e){return(0,o.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,o.jsx)("path",{fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"})})}const Re={icon:(0,o.jsx)(ze,{}),title:(0,o.jsx)(h.A,{id:"theme.admonition.note",description:"The default label used for the Note admonition (:::note)",children:"note"})};function Se(e){return(0,o.jsx)(Ee,{...Re,...e,className:(0,u.A)("alert alert--secondary",e.className),children:e.children})}function De(e){return(0,o.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,o.jsx)("path",{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})})}const Oe={icon:(0,o.jsx)(De,{}),title:(0,o.jsx)(h.A,{id:"theme.admonition.tip",description:"The default label used for the Tip admonition (:::tip)",children:"tip"})};function Pe(e){return(0,o.jsx)(Ee,{...Oe,...e,className:(0,u.A)("alert alert--success",e.className),children:e.children})}function Ve(e){return(0,o.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,o.jsx)("path",{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})})}const Ge={icon:(0,o.jsx)(Ve,{}),title:(0,o.jsx)(h.A,{id:"theme.admonition.info",description:"The default label used for the Info admonition (:::info)",children:"info"})};function Fe(e){return(0,o.jsx)(Ee,{...Ge,...e,className:(0,u.A)("alert alert--info",e.className),children:e.children})}function We(e){return(0,o.jsx)("svg",{viewBox:"0 0 16 16",...e,children:(0,o.jsx)("path",{fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"})})}const qe={icon:(0,o.jsx)(We,{}),title:(0,o.jsx)(h.A,{id:"theme.admonition.warning",description:"The default label used for the Warning admonition (:::warning)",children:"warning"})};function $e(e){return(0,o.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,o.jsx)("path",{fillRule:"evenodd",d:"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"})})}const Ye={icon:(0,o.jsx)($e,{}),title:(0,o.jsx)(h.A,{id:"theme.admonition.danger",description:"The default label used for the Danger admonition (:::danger)",children:"danger"})};const Ze={icon:(0,o.jsx)(We,{}),title:(0,o.jsx)(h.A,{id:"theme.admonition.caution",description:"The default label used for the Caution admonition (:::caution)",children:"caution"})};const Qe={...{note:Se,tip:Pe,info:Fe,warning:function(e){return(0,o.jsx)(Ee,{...qe,...e,className:(0,u.A)("alert alert--warning",e.className),children:e.children})},danger:function(e){return(0,o.jsx)(Ee,{...Ye,...e,className:(0,u.A)("alert alert--danger",e.className),children:e.children})}},...{secondary:e=>(0,o.jsx)(Se,{title:"secondary",...e}),important:e=>(0,o.jsx)(Fe,{title:"important",...e}),success:e=>(0,o.jsx)(Pe,{title:"success",...e}),caution:function(e){return(0,o.jsx)(Ee,{...Ze,...e,className:(0,u.A)("alert alert--warning",e.className),children:e.children})}}};function Xe(e){const n=we(e),t=(s=n.type,Qe[s]||(console.warn(`No admonition component found for admonition type "${s}". Using Info as fallback.`),Qe.info));var s;return(0,o.jsx)(t,{...n})}var Je=t(172);const Ke={Head:he.A,details:Le,Details:Le,code:function(e){return function(e){return void 0!==e.children&&s.Children.toArray(e.children).every((e=>"string"==typeof e&&!e.includes("\n")))}(e)?(0,o.jsx)(pe,{...e}):(0,o.jsx)(xe.A,{...e})},a:function(e){return(0,o.jsx)(x.A,{...e})},pre:function(e){return(0,o.jsx)(o.Fragment,{children:e.children})},ul:function(e){return(0,o.jsx)("ul",{...e,className:ke(e.className)})},li:function(e){return(0,fe.A)().collectAnchor(e.id),(0,o.jsx)("li",{...e})},img:function(e){return(0,o.jsx)("img",{decoding:"async",loading:"lazy",...e,className:(n=e.className,(0,u.A)(n,He.img))});var n},h1:e=>(0,o.jsx)(ye,{as:"h1",...e}),h2:e=>(0,o.jsx)(ye,{as:"h2",...e}),h3:e=>(0,o.jsx)(ye,{as:"h3",...e}),h4:e=>(0,o.jsx)(ye,{as:"h4",...e}),h5:e=>(0,o.jsx)(ye,{as:"h5",...e}),h6:e=>(0,o.jsx)(ye,{as:"h6",...e}),admonition:Xe,mermaid:Je.A};function en(e){let{children:n}=e;return(0,o.jsx)(me.x,{components:Ke,children:n})}function nn(e){let{children:n}=e;const t=function(){const{metadata:e,frontMatter:n,contentTitle:t}=c();return n.hide_title||void 0!==t?null:e.title}();return(0,o.jsxs)("div",{className:(0,u.A)(b.G.docs.docMarkdown,"markdown"),children:[t&&(0,o.jsx)("header",{children:(0,o.jsx)(ue.A,{as:"h1",children:t})}),(0,o.jsx)(en,{children:n})]})}var tn=t(628),sn=t(8993),an=t(87);function on(e){return(0,o.jsx)("svg",{viewBox:"0 0 24 24",...e,children:(0,o.jsx)("path",{d:"M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z",fill:"currentColor"})})}const ln={breadcrumbHomeIcon:"breadcrumbHomeIcon_P9HZ"};function rn(){const e=(0,an.Ay)("/");return(0,o.jsx)("li",{className:"breadcrumbs__item",children:(0,o.jsx)(x.A,{"aria-label":(0,h.T)({id:"theme.docs.breadcrumbs.home",message:"Home page",description:"The ARIA label for the home page in the breadcrumbs"}),className:"breadcrumbs__link",href:e,children:(0,o.jsx)(on,{className:ln.breadcrumbHomeIcon})})})}const cn={breadcrumbsContainer:"breadcrumbsContainer_SmPB"};function dn(e){let{children:n,href:t,isLast:s}=e;const i="breadcrumbs__link";return s?(0,o.jsx)("span",{className:i,itemProp:"name",children:n}):t?(0,o.jsx)(x.A,{className:i,href:t,itemProp:"item",children:(0,o.jsx)("span",{itemProp:"name",children:n})}):(0,o.jsx)("span",{className:i,children:n})}function un(e){let{children:n,active:t,index:s,addMicrodata:i}=e;return(0,o.jsxs)("li",{...i&&{itemScope:!0,itemProp:"itemListElement",itemType:"https://schema.org/ListItem"},className:(0,u.A)("breadcrumbs__item",{"breadcrumbs__item--active":t}),children:[n,(0,o.jsx)("meta",{itemProp:"position",content:String(s+1)})]})}function mn(){const e=(0,tn.OF)(),n=(0,sn.Dt)();return e?(0,o.jsx)("nav",{className:(0,u.A)(b.G.docs.docBreadcrumbs,cn.breadcrumbsContainer),"aria-label":(0,h.T)({id:"theme.docs.breadcrumbs.navAriaLabel",message:"Breadcrumbs",description:"The ARIA label for the breadcrumbs"}),children:(0,o.jsxs)("ul",{className:"breadcrumbs",itemScope:!0,itemType:"https://schema.org/BreadcrumbList",children:[n&&(0,o.jsx)(rn,{}),e.map(((n,t)=>{const s=t===e.length-1,i="category"===n.type&&n.linkUnlisted?void 0:n.href;return(0,o.jsx)(un,{active:s,index:t,addMicrodata:!!i,children:(0,o.jsx)(dn,{href:i,isLast:s,children:n.label})},t)}))]})}):null}function hn(){return(0,o.jsx)(h.A,{id:"theme.unlistedContent.title",description:"The unlisted content banner title",children:"Unlisted page"})}function xn(){return(0,o.jsx)(h.A,{id:"theme.unlistedContent.message",description:"The unlisted content banner message",children:"This page is unlisted. Search engines will not index it, and only users having a direct link can access it."})}function pn(){return(0,o.jsx)(he.A,{children:(0,o.jsx)("meta",{name:"robots",content:"noindex, nofollow"})})}function fn(e){let{className:n}=e;return(0,o.jsx)(Xe,{type:"caution",title:(0,o.jsx)(hn,{}),className:(0,u.A)(n,b.G.common.unlistedBanner),children:(0,o.jsx)(xn,{})})}function vn(e){return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(pn,{}),(0,o.jsx)(fn,{...e})]})}const gn={docItemContainer:"docItemContainer_BtsR",docItemCol:"docItemCol_nWX2"};function jn(e){let{children:n}=e;const t=function(){const{frontMatter:e,toc:n}=c(),t=(0,m.l)(),s=e.hide_table_of_contents,i=!s&&n.length>0;return{hidden:s,mobile:i?(0,o.jsx)(ae,{}):void 0,desktop:!i||"desktop"!==t&&"ssr"!==t?void 0:(0,o.jsx)(de,{})}}(),{metadata:{unlisted:s}}=c();return(0,o.jsxs)("div",{className:"row",children:[(0,o.jsxs)("div",{className:(0,u.A)("col",!t.hidden&&gn.docItemCol),children:[s&&(0,o.jsx)(vn,{}),(0,o.jsx)(T,{}),(0,o.jsxs)("div",{className:gn.docItemContainer,children:[(0,o.jsxs)("article",{children:[(0,o.jsx)(mn,{}),(0,o.jsx)(k,{}),t.mobile,(0,o.jsx)(nn,{children:n}),(0,o.jsx)(V,{})]}),(0,o.jsx)(v,{})]})]}),t.desktop&&(0,o.jsx)("div",{className:"col col--3",children:t.desktop})]})}function bn(e){const n=`docs-doc-id-${e.content.metadata.id}`,t=e.content;return(0,o.jsx)(r,{content:e.content,children:(0,o.jsxs)(i.e3,{className:n,children:[(0,o.jsx)(d,{}),(0,o.jsx)(jn,{children:(0,o.jsx)(t,{})})]})})}},9252:(e,n,t)=>{t.d(n,{R:()=>o,x:()=>l});var s=t(7378);const i={},a=s.createContext(i);function o(e){const n=s.useContext(a);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),s.createElement(a.Provider,{value:n},e.children)}}}]);