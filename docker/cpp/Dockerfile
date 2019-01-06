# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

FROM node:8

WORKDIR /usr/src/app
ADD . /usr/src/app

RUN apt-get update
RUN apt-get -y install apt-transport-https libtbb-dev cmake libboost-all-dev