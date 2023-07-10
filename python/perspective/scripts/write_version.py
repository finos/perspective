#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import os
import json
import logging

logging.basicConfig(level=logging.INFO)


def truncate_patch_version(version):
    """Return just the major and minor versions from `version`."""
    split_version = version.split(".")
    return "{}.{}".format(split_version[0], split_version[1])


def write_version():
    """Retrieves the version string from `package.json` managed by Lerna,
    and writes it into `_version.py`. This script is run as part of Lerna's
    "version" task, which ensures that changes are made `after` the version
    has been updated, but `before` the changes made as part of `lerna version`
    are committed."""
    logging.info("Updating Python `__version__` from `package.json`")

    here = os.path.abspath(os.path.dirname(__file__))
    package_json_path = os.path.join(here, "..", "package.json")
    version = None

    with open(os.path.realpath(package_json_path), "r") as f:
        version = json.load(f)["version"]

    logging.info("Updating `perspective-python` to version `{}`".format(version))

    version_py_path = os.path.join(here, "..", "perspective", "core", "_version.py")

    # PerspectiveWidget uses the major and minor versions for semver only.
    truncated = truncate_patch_version(version)

    with open(os.path.realpath(version_py_path), "w") as f:
        f.write('__version__ = "{}"\n'.format(version))
        f.write('major_minor_version = "{}"\n'.format(truncated))

    logging.info("`perspective-python` updated to version `{}`".format(version))
    logging.info("`PerspectiveWidget` now requires `perspective-jupyterlab` version `~{}`".format(truncated))


if __name__ == "__main__":
    write_version()
