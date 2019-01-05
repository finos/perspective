# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

FROM timkpaine/perspective-python-binding

WORKDIR /usr/src/app
ADD . /usr/src/app

RUN python3 -m pip install codecov nose2 mock flake8
RUN python3 -m pip install -r python/requirements.txt

RUN DOCKER=true cd python && make build && make test
