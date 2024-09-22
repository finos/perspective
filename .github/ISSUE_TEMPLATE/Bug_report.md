---
name: 🐛 Bug Report
about: If something isn't working as expected 🤔.
---

## Bug Report

### Steps to Reproduce:

Please provide a full reproduction of the issue. There are two ways we accept
repros:

1.  If the issue you are reporting is a UX/UI issue which can be recreated by
    visiting a Perspective demo _hosted by the project itself_, and any dataset
    required to reproduce the error can be included in the report. In this case,
    please provided detailed step-by-step instructions on how to reproduce,
    including any screenshots which help illustrate, as well as including any
    fully-encoded test data we may need.

2.  If you are reporting a build or installation issue with the library itself,
    which can be recreated from a shell. In this case, please provided detailed
    code blocks describing how you tried to install, which commands were issued,
    including and dependencies you needed to install and hwo you installed them.

3.  If you are reporting a _anything else_, including but not limited to:

        - Build issues which require _any_ metadata files e.g. a `package.json`,
          `Cargo.toml`, etc.
        - Bundler or packaging errors with JavaScript.
        - Library functions which return the wrong results or error.
        - CPU or memory usage performance regressions, or regressions in thread
          utilization.

    In this case, we require a _complete reproduction_ reproducing the issue.
    Lifting this exceptional definition of a _complete repro_ from
    [@Rich-Harris micro-essay on Repros](https://gist.github.com/Rich-Harris/88c5fc2ac6dc941b22e7996af05d70ff),
    please follow these guidelines:

    1. Create a sample repo on GitHub (or wherever)
    2. Demonstrate the problem, and nothing but the problem. If the app where
       you're experiencing the issue happens to use Gulp, I don't care, unless
       the problem involves Gulp. Remove that stuff. Whittle it down to the
       _bare minimum_ of code that reliably demonstrates the issue. Get rid of
       any dependencies that aren't _directly_ related to the problem.
    3. Install all your dependencies to `package.json`. If I can't clone the
       repo and do `npm install && npm run build` (or similar – see point 4) to
       see the problem, because I need some globally installed CLI tool or
       whatever, then you've made it harder to get to the bottom of the issue.
    4. Include instructions in the repo, along with a description of the
       expected and actual behaviour. Obviously the issue should include
       information about the bug as well, but it's really helpful if `README.md`
       includes that information, plus a link back to the issue. If there are
       any instructions beyond `npm install && npm run build`, they should go
       here.

### Expected Result:

Describe what you expected to see. If you are reporting a UX/UI error, this may
include screenshots with annotations.

### Actual Result:

Describe what actually happened, with special attention to the errant behavior.
Always include:

-   OS and version
-   Platform/language + version

If you are reporting a UX/UI error:

-   (if websocket) Platform/language + version of remote perspective server.
-   Full exception/error message if applicable.
-   Any potentially relevent JavaScript developer console error logs.
-   Screenshots of the UI in an obviously broken state. (but please try to avoid
    screenshots of your code, see below)

If you are reporting a library error:

-   (if websocket) Platform/language + version of remote perspective server.
-   Full exception error capture (please include the entire stack trace,
    including "caused by" entries), log entries, etc. where appropriate. Please
    avoid posting screenshots of code (which we may need to debug).

If you are reporting a build or install error:

-   Full error output from running your repro, formatted as a code block (please
    _do not_ include screenshots of build logs).

### Environment:

For JavaScript (browser):

-   `@finos/perspective` version
-   Browser and version
-   OS
-   (if websocket) Language/version/OS of perspective server

For Node.js:

-   `node` version
-   OS

For Python

-   `python` interpreter version (Only CPython).
-   package manager and version (conda/pip/\*)
    -   Are you compiling from an sdist of wheel?
-   Platform and version (Jupyter/tornado/lib/\*)
-   OS

### Additional Context:

Add any other context about the problem here.
