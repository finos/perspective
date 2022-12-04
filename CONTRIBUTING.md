# Contributing

Thank you for your interest in contributing to Perspective!

Perspective is built on open source and hosted by the Fintech Open Source Foundation (FINOS). We invite you to participate in our community by adding and commenting on [issues](https://github.com/finos/perspective/issues) (e.g., bug reports; new feature suggestions) or contributing code enhancements through a pull request.

Note that commits and pull requests to FINOS repositories such as Perspective may only be accepted from those contributors with a [Contributor License Agreement (CLA)](https://finosfoundation.atlassian.net/wiki/spaces/FINOS/pages/75530375/Contribution+Compliance+Requirements#ContributionComplianceRequirements-ContributorLicenseAgreement) with FINOS. This may take the form of either:
* an active, executed Individual Contributor License Agreement (ICLA) with FINOS, OR
* coverage under an existing, active Corporate Contribution License Agreement (CCLA) executed with FINOS (most likely by the developer's employer). Please note that some, though not all, CCLAs require individuals/employees to be explicitly named on the CCLA.

Commits from individuals not covered under an CLA can not be merged by Perspective's committers. We encourage you to check that you have a CLA in place well in advance of making your first pull request. 

Need an ICLA? Unsure if you are covered under an existing CCLA? Confused? Email [help@finos.org](mailto:help@finos.org) and the foundation team will help get it sorted out for you. 

If you have any general questions about contributing to Perspective, please feel free to open an issue on [github](https://github.com/finos/perspective/issues/new), or email [help@finos.org](mailto:finos.org).

## Guidelines

When submitting PRs to Perspective, please respect the following general
coding guidelines:

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


