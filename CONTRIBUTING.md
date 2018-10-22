# Contributing

Thank you for your interest in contributing to Perspective!

Perspective is built on open source and we invite you to contribute enhancements. Upon review you will be required to complete the [Contributor License Agreement (CLA)](https://github.com/jpmorganchase/cla) before we are able to merge. 

If you have any questions about the contribution process, please feel free to chat with us on [gitter](https://gitter.im/jpmorganchase/perspective), or send an email to [quorum_info@jpmorgan.com](mailto:quorum_info@jpmorgan.com).

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
* All PRs should be accompanied by tests asserting their behavior in any packages they modify.  C++ and Javascript changes to `@jpmorganchase/perspective` should add Node.js tests, and additional changes should add Puppeteer tests.
* If your PR modifies the C++ or JS `@jpmorganchase/perspective` code in a way which may affect performance, be sure to update the benchmark suite as per the [Developer Documentation]().
* Do not commit with `--no-verify` or otherwise bypass commit hooks, and please respect the formatting and linting guidelines they enforce.
* Do not `merge master` upstream changes into your PR.  If your change has conflicts with the `master` branch, please pull master into your fork's master, then rebase.


