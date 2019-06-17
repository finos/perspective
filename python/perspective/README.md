# perspective-python
Python APIs for [perspective](https://github.com/finos/perspective) front end

[![Build Status](https://travis-ci.org/finos/perspective.svg?branch=master)](https://travis-ci.org/finos/perspective)
[![GitHub issues](https://img.shields.io/github/issues/finos/perspective.svg)]()
[![codecov](https://codecov.io/gh/finos/perspective/branch/master/graph/badge.svg)](https://codecov.io/gh/finos/perspective)
[![PyPI](https://img.shields.io/pypi/v/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)
[![PyPI](https://img.shields.io/pypi/l/perspective-python.svg)](https://pypi.python.org/pypi/perspective-python)


## Install
To install the base package from pip:

`pip install perspective-python`

To Install from source:

`make install`


To install the JupyterLab extension:

`jupyter labextension install @finos/perspective-jupyterlab`

or from source:

`make labextension`

## Getting Started
[Example Notebooks](https://github.com/finos/perspective/tree/master/python/perspective/examples)

![](https://github.com/finos/perspective/raw/master/python/perspective/docs/img/scatter.png)


## Pandas Pivot integration

#### Index - Multiindex pivot
![](https://github.com/finos/perspective/raw/master/python/perspective/docs/img/pandas1.png)

#### Column - Multiindex pivot
![](https://github.com/finos/perspective/raw/master/python/perspective/docs/img/pandas2.png)

## C++ Integration
This package is primarily focused on integrating with the WebAssembly version of Perspective. To build the C++ side, install `perspective-python[table]`, from the [Perspective main library](https://github.com/finos/perspective/tree/master/python).

## Webserver Integration
`perspective-pyton` can be integrated with a webserver, giving you the ability to configure `perspective-viewers` in javascript from python. Right now this functionality is limited to `tornado` webservers and the `perspective-phosphor` frontend. It relies on the [phosphor-perspective-utils](https://github.com/timkpaine/phosphor-perspective-utils) javascript package.

```python3
import tornado.web
from perspective import PerspectiveHTTPMixin


class MyHandler(PerspectiveHTTPMixin, tornado.web.RequestHandler):
    def get(self):
        super(MyHandler, self).loadData(data=<data>, transfer_as_arrow=True)
        self.write(super(MyHandler, self).getData())
```


