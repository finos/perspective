(self.webpackChunk_finos_perspective_docs=self.webpackChunk_finos_perspective_docs||[]).push([[423],{5564:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>l,toc:()=>d});var i=s(6106),t=s(9252);const r={id:"development",title:"Developer Guide"},o=void 0,l={id:"development",title:"Developer Guide",description:"Thank you for your interest in contributing to Perspective! This guide will",source:"@site/docs/development.md",sourceDirName:".",slug:"/development",permalink:"/docs/development",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"development",title:"Developer Guide"},sidebar:"tutorialSidebar",previous:{title:"Data Binding",permalink:"/docs/server"}},c={},d=[{value:"System Dependencies",id:"system-dependencies",level:3},{value:"Build",id:"build",level:2},{value:"<code>Perspective.js</code>",id:"perspectivejs",level:2},{value:"Building via local EMSDK",id:"building-via-local-emsdk",level:4},{value:"<code>perspective-python</code>",id:"perspective-python",level:2},{value:"<code>perspective-jupyterlab</code>",id:"perspective-jupyterlab",level:3},{value:"System-Specific Instructions",id:"system-specific-instructions",level:2},{value:"MacOS/OSX",id:"macososx",level:3},{value:"Windows 10",id:"windows-10",level:3},{value:"Ubuntu/Debian",id:"ubuntudebian",level:3},{value:"Test",id:"test",level:2},{value:"JavaScript",id:"javascript",level:3},{value:"Troubleshooting installation from source",id:"troubleshooting-installation-from-source",level:3},{value:"Benchmark",id:"benchmark",level:2}];function a(e){const n={a:"a",code:"code",em:"em",h2:"h2",h3:"h3",h4:"h4",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.p,{children:"Thank you for your interest in contributing to Perspective! This guide will\nteach you everything you need to know to get started hacking on the Perspective\ncodebase."}),"\n",(0,i.jsx)(n.p,{children:"If you're coming to this project as principally a JavaScript developer, please\nbe aware that Perspective is quite a bit more complex than a typical NPM package\ndue to the mixed-language nature of the project; we've done quite a bit to make\nsure the newcomer experience is as straightforward as possible, but some things\nmight not work the way you're used to!"}),"\n",(0,i.jsxs)(n.p,{children:["Perspective is organized as a\n",(0,i.jsx)(n.a,{href:"https://github.com/babel/babel/blob/master/doc/design/monorepo.md",children:"monorepo"}),",\nand uses ",(0,i.jsx)(n.a,{href:"https://lernajs.io/",children:"lerna"})," to manage dependencies."]}),"\n",(0,i.jsxs)(n.p,{children:["This guide provides instructions for both the JavaScript and Python libraries.\nTo switch your development toolchain between the two, use ",(0,i.jsx)(n.code,{children:"yarn setup"}),". Once the\nsetup script has been run, common commands like ",(0,i.jsx)(n.code,{children:"yarn build"})," and ",(0,i.jsx)(n.code,{children:"yarn test"}),"\nautomatically call the correct build and test tools."]}),"\n",(0,i.jsx)(n.h3,{id:"system-dependencies",children:"System Dependencies"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"Perspective.js"})," and ",(0,i.jsx)(n.code,{children:"perspective-python"})," ",(0,i.jsx)(n.strong,{children:"require"})," the following system\ndependencies to be installed:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.a,{href:"https://cmake.org/",children:"CMake"})," (version 3.29.5 or higher)"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.a,{href:"https://www.boost.org/",children:"Boost"})," (version 1.83 or highery). This can be\ninstalled from tarball with the included script\n",(0,i.jsx)(n.code,{children:"node tools/perspective-scripts/install_tools.mjs"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.a,{href:"https://pnpm.io/",children:"pnpm"}),"."]}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:(0,i.jsxs)(n.em,{children:["This list may be non-exhaustive depending on your OS/environment; please open\na thread in ",(0,i.jsx)(n.a,{href:"https://github.com/finos/perspective/discussions",children:"Discussions"})," if\nyou have any questions"]})})}),"\n",(0,i.jsx)(n.h2,{id:"build",children:"Build"}),"\n",(0,i.jsxs)(n.p,{children:["Make sure you have the system dependencies installed. For specifics depending on\nyour OS, check the ",(0,i.jsx)(n.a,{href:"#system-specific-instructions",children:"system-specific instructions"}),"\nbelow."]}),"\n",(0,i.jsx)(n.p,{children:"To run a build, use"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pnpm run build\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If this is the first time you've built Perspective, you'll be asked to generate\na ",(0,i.jsx)(n.code,{children:".perspectiverc"})," via a short survey. This can be later re-configured via"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pnpm run setup\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If everything is successful, you should be able to run any of the ",(0,i.jsx)(n.code,{children:"examples/"}),"\npackages, e.g. ",(0,i.jsx)(n.code,{children:"examples/blocks"})," like so:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pnpm run start blocks\n"})}),"\n",(0,i.jsx)(n.h2,{id:"perspectivejs",children:(0,i.jsx)(n.code,{children:"Perspective.js"})}),"\n",(0,i.jsxs)(n.p,{children:["To build the JavaScript library, which includes WebAssembly compilation,\n",(0,i.jsx)(n.a,{href:"https://github.com/kripken/emscripten",children:"Emscripten"})," and its prerequisites are\nrequired."]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"Perspective.js"})," specifies its Emscripten version dependency in ",(0,i.jsx)(n.code,{children:"package.json"}),",\nand the correct version of Emscripten will be installed with other JS\ndependencies by running ",(0,i.jsx)(n.code,{children:"yarn"}),"."]}),"\n",(0,i.jsx)(n.h4,{id:"building-via-local-emsdk",children:"Building via local EMSDK"}),"\n",(0,i.jsxs)(n.p,{children:["To build using an Emscripten install on your local system and not the Emscripten\nbundled with Perspective in its ",(0,i.jsx)(n.code,{children:"package.json"}),",\n",(0,i.jsx)(n.a,{href:"https://emscripten.org/docs/getting_started/downloads.html",children:"install"})," the\nEmscripten SDK, then activate and export the latest ",(0,i.jsx)(n.code,{children:"emsdk"})," environment via\n",(0,i.jsx)(n.a,{href:"https://github.com/juj/emsdk",children:(0,i.jsx)(n.code,{children:"emsdk_env.sh"})}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"source emsdk/emsdk_env.sh\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Deviating from this specific version of Emscripten specified in the project's\n",(0,i.jsx)(n.code,{children:"package.json"})," can introduce various errors that are extremely difficult to\ndebug."]}),"\n",(0,i.jsxs)(n.p,{children:["To install a specific version of Emscripten (e.g. ",(0,i.jsx)(n.code,{children:"2.0.6"}),"):"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"./emsdk install 2.0.6\n"})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h2,{id:"perspective-python",children:(0,i.jsx)(n.code,{children:"perspective-python"})}),"\n",(0,i.jsxs)(n.p,{children:["To build the Python library, first configure your project to build Python via\n",(0,i.jsx)(n.code,{children:"yarn setup"}),". Then, install the requirements corresponding to your version of\npython, e.g."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pip install -r rust/perspective-python/requirements.txt\n"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"perspective-python"})," supports Python 3.8 and upwards."]}),"\n",(0,i.jsx)(n.h3,{id:"perspective-jupyterlab",children:(0,i.jsx)(n.code,{children:"perspective-jupyterlab"})}),"\n",(0,i.jsxs)(n.p,{children:["To install the Jupyterlab/Jupyter Notebook plugins from your local working\ndirectory, simply install ",(0,i.jsx)(n.code,{children:"python/perspective"})," with ",(0,i.jsx)(n.code,{children:"pip"})," as you might normally\ndo."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"# builds labextension to the perspective-python python package root directory\nPACKAGE=perspective-jupyterlab pnpm run build\n# editable install of the python package\npnpm -F @finos/perspective-python develop:maturin\n# set up symlink of our labextension to jupyter share directory\n# this directory's path is in the output of `jupyter labextension list`\npnpm -F @finos/perspective-python develop:labextension\n"})}),"\n",(0,i.jsxs)(n.p,{children:['Afterwards, you should see it listed as a "local extension" when you run\n',(0,i.jsx)(n.code,{children:"jupyter labextension list"})," and as a normal extension when you run\n",(0,i.jsx)(n.code,{children:"jupyter nbextension list"}),"."]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h2,{id:"system-specific-instructions",children:"System-Specific Instructions"}),"\n",(0,i.jsx)(n.h3,{id:"macososx",children:"MacOS/OSX"}),"\n",(0,i.jsx)(n.p,{children:"Install system dependencies through Homebrew:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"brew install cmake llvm@17\nbrew link llvm@17 # optional, see below\n"})}),"\n",(0,i.jsxs)(n.p,{children:["On M1 (Apple Silicon) systems, make sure your brew-installed dependencies are in\n",(0,i.jsx)(n.code,{children:"/opt/homebrew"})," (the default location), and that ",(0,i.jsx)(n.code,{children:"/opt/homebrew/bin"})," is on the\n",(0,i.jsx)(n.code,{children:"PATH"}),"."]}),"\n",(0,i.jsx)(n.p,{children:"If you do not want to link the llvm@17 keg, then while developing ensure it is\non your PATH too, like this:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"PATH=$(brew --prefix llvm@17)/bin:$PATH\n"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Note"}),": Perspective vendors its C++ extensions, so you may run into trouble\nbuilding if you have ",(0,i.jsx)(n.code,{children:"brew"}),"-installed versions of libraries, such as\n",(0,i.jsx)(n.code,{children:"flatbuffers"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"windows-10",children:"Windows 10"}),"\n",(0,i.jsxs)(n.p,{children:["You need to use bash in order to build Perspective packages. To successfully\nbuild on Windows 10, enable\n",(0,i.jsx)(n.a,{href:"https://docs.microsoft.com/en-us/windows/wsl/install-win10",children:"Windows Subsystem for Linux"}),"\n(WSL) and install the Linux distribution of your choice."]}),"\n",(0,i.jsx)(n.p,{children:"Create symbolic links to easily access Windows directories and projects modified\nvia Windows. This way, you can modify any of the Perspective files using your\nfavorite editors on Windows and build via Linux."}),"\n",(0,i.jsx)(n.p,{children:"Follow the Linux specific instructions to install Emscripten and all\nprerequisite tools."}),"\n",(0,i.jsx)(n.h3,{id:"ubuntudebian",children:"Ubuntu/Debian"}),"\n",(0,i.jsxs)(n.p,{children:["On Ubuntu, CMake will mistakenly resolve the system headers in ",(0,i.jsx)(n.code,{children:"/usr/include"}),"\nrather than the emscripten supplied versions. You can resolve this by moving\n",(0,i.jsx)(n.code,{children:"boost"})," dependencies to somewhere other than ",(0,i.jsx)(n.code,{children:"/usr/include"})," - into Perspective's\nown ",(0,i.jsx)(n.code,{children:"src"})," dir (as per\n",(0,i.jsx)(n.a,{href:"http://vclf.blogspot.com/2014/08/emscripten-linking-to-boost-libraries.html",children:"here"}),")."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"apt-get install libboost-all-dev\ncp -r /usr/include/boost ./packages/perspective/src/include/\n"})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h2,{id:"test",children:"Test"}),"\n",(0,i.jsx)(n.p,{children:"You can run the test suite simply with the standard NPM command, which will both\nbuild the test suite for every package and run them."}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pnpm run test\n"})}),"\n",(0,i.jsx)(n.h3,{id:"javascript",children:"JavaScript"}),"\n",(0,i.jsxs)(n.p,{children:["The JavaScript test suite is composed of two sections: a Node.js test, which\nasserts behavior of the ",(0,i.jsx)(n.code,{children:"@finos/perspective"})," library, and a suite of\n",(0,i.jsx)(n.a,{href:"https://playwright.dev/",children:"Playwright"})," tests, which assert the behavior of the\nrest of the UI facing packages."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pnpm run test --update-snapshots\n"})}),"\n",(0,i.jsx)(n.h3,{id:"troubleshooting-installation-from-source",children:"Troubleshooting installation from source"}),"\n",(0,i.jsxs)(n.p,{children:["If you are installing from a source distribution (sdist), make sure you have the\n",(0,i.jsx)(n.a,{href:"#system-dependencies",children:"System Dependencies"})," installed."]}),"\n",(0,i.jsx)(n.p,{children:"Try installing in verbose mode:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pip install -vv perspective-python\n"})}),"\n",(0,i.jsx)(n.p,{children:"The most common culprits are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"CMake version is too old"}),"\n",(0,i.jsx)(n.li,{children:"Boost headers are missing or too old"}),"\n"]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h2,{id:"benchmark",children:"Benchmark"}),"\n",(0,i.jsxs)(n.p,{children:["You can generate benchmarks specific to your machine's OS and CPU architecture\nwith Perspective's benchmark suite, which will host a live dashboard at\n",(0,i.jsx)(n.a,{href:"http://localhost:8080",children:"http://localhost:8080"})," as well as output a result ",(0,i.jsx)(n.code,{children:"benchmark.arrow"})," file."]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-bash",children:"pnpm run bench\n"})})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(a,{...e})}):a(e)}},9252:(e,n,s)=>{s.d(n,{R:()=>o,x:()=>l});var i=s(7378);const t={},r=i.createContext(t);function o(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:o(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);