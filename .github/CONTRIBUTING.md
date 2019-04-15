# Contributing to Perspective

Thank you for your interest in contributing to Perspective!

Perspective is built on open source and we invite you to contribute enhancements. Upon review you will be required to complete the [Contributor License Agreement (CLA)](https://finosfoundation.atlassian.net/wiki/spaces/FINOS/pages/75530375/Contribution+Compliance+Requirements#ContributionComplianceRequirements-ContributorLicenseAgreement) before we are able to merge.

If you have any questions about the contribution process, please feel free to chat with us on [gitter](https://gitter.im/finos/perspective), or open an issue on [github](https://github.com/finos/perspective/issues/new)

## Guidelines

When submitting PRs to Perspective, please respect the following general coding guidelines:

* All PRs should be accompanied by an appropriate label as per [lerna-changelog](https://github.com/lerna/lerna-changelog), and reference any issue they resolve.
* Please try to keep PRs small and focused.  If you find your PR touches multiple loosely related changes, it may be best to break up into multiple PRs.
* Individual commits should preferably do One Thing (tm), and have descriptive commit messages.  Do not make "WIP" or other mystery commit messages.
* ... that being said, one-liners or other commits should typically be grouped.  Please try to keep 'cleanup', 'formatting' or other non-functional changes to a single commit at most in your PR.
* PRs that involve moving files around the repository tree should be organized in a stand-alone commit from actual code changes.
* Please do not submit incomplete PRs or partially implemented features.  Feature additions should be implemented completely, including Javascript API and `<perspective-viewer>` UX.  If your PR is a build, documentation, test change, or an API change that is not applicable to the UX, please explain this in the comments.
* Please do not submit PRs disabled by feature or build flag - experimental features should be kept on a branch until they are ready to be merged.
* Feature additions, make sure you have added complete JSDoc to any new APIs, as well as additions to the [Usage Guide]() if applicable.
* All PRs should be accompanied by tests asserting their behavior in any packages they modify.  C++ and Javascript changes to `@finos/perspective` should add Node.js tests, and additional changes should add Puppeteer tests.
* If your PR modifies the C++ or JS `@finos/perspective` code in a way which may affect performance, be sure to update the benchmark suite as per the [Developer Documentation]().
* Do not commit with `--no-verify` or otherwise bypass commit hooks, and please respect the formatting and linting guidelines they enforce.
* Do not `merge master` upstream changes into your PR.  If your change has conflicts with the `master` branch, please pull master into your fork's master, then rebase.
* Ensure all new files include a header comment block containing the [Apache License v2.0 and your copyright information](http://www.apache.org/licenses/LICENSE-2.0#apply).
* If necessary (e.g. due to 3rd party dependency licensing requirements), update the [NOTICE file](https://github.com/finos/perspective/blob/master/NOTICE) with any new attribution or other notices

# Contributor License Agreement (CLA)
A CLA is a document that specifies how a project is allowed to use your
contribution; they are commonly used in many open source projects.

**_All_ contributions to _all_ projects hosted by [FINOS](https://www.finos.org/)
must be made with a
[Foundation CLA](https://finosfoundation.atlassian.net/wiki/spaces/FINOS/pages/83034172/Contribute)
in place, and there are [additional legal requirements](https://finosfoundation.atlassian.net/wiki/spaces/FINOS/pages/75530375/Legal+Requirements)
that must also be met.**

As a result, PRs submitted to the {project name} project cannot be accepted until you have a CLA in place with the Foundation.

# Contributing Issues

## Prerequisites

* [ ] Have you [searched for duplicates](https://github.com/finos/perspective/issues?utf8=%E2%9C%93&q=)?  A simple search for exception error messages or a summary of the unexpected behaviour should suffice.
* [ ] Are you running the latest version?
* [ ] Are you sure this is a bug or missing capability?

## Raising an Issue
* Create your issue [here](https://github.com/finos/perspective/issues/new).
* New issues contain two templates in the description: bug report and enhancement request. Please pick the most appropriate for your issue, **then delete the other**.
  * Please also tag the new issue with either "Bug" or "Enhancement".
* Please use [Markdown formatting](https://help.github.com/categories/writing-on-github/)
liberally to assist in readability.
  * [Code fences](https://help.github.com/articles/creating-and-highlighting-code-blocks/) for exception stack traces and log entries, for example, massively improve readability.
