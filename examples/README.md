# Examples

The projects in the directory are self-contained Perspective examples. However,
they are designed to run within the Perspective source repository tree. This
makes it easy for Perspective OSS developers to test changes and validate that
our Examples continue to work, but it also means these examples will most not
work without properly linking in the Perspective build environment.

In order to _run_ a project in this directory as written:

1. Install and build Perspective from source.
2. Run the project with `pnpm run start $PROJECT_NAME` from the repository root
   (_not_ the `/examples` directory).

# Optional

Generally, the changes necessary to make these examples run _without_ the
Perspective source repository are minor path or metadata corrections. Your
results may vary.
