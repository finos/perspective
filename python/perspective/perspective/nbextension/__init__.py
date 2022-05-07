################################################################################
#
# Copyright (c) 2022, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


def _jupyter_nbextension_paths():
    return [
        {
            "section": "notebook",
            "src": "nbextension/static",
            "dest": "@finos/perspective-jupyter",
            "require": "@finos/perspective-jupyter/extension",
        }
    ]
