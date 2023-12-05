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

from __future__ import print_function

import os
import os.path
import platform
import re
import subprocess
import sys
import sysconfig
from codecs import open
from distutils.version import LooseVersion
from jupyter_packaging import get_data_files, wrap_installers, get_version

from setuptools import Extension, find_packages, setup
from setuptools.command.build_ext import build_ext
from setuptools.command.sdist import sdist

try:
    from shutil import which

    CPU_COUNT = os.cpu_count()
except ImportError:
    raise Exception("Requires Python 3.7 or later")


here = os.path.abspath(os.path.dirname(__file__))
nb_path = os.path.join("perspective", "nbextension", "static")
lab_path = os.path.join("perspective", "labextension")

with open(os.path.join(here, "README.md"), encoding="utf-8") as f:
    long_description = f.read().replace("\r\n", "\n")

if sys.version_info.major < 3:
    raise Exception("Requires Python 3.7 or later")

# Check for `cmake`
if which("cmake") is None and which("cmake.exe") is None:
    raise Exception("Requires cmake")

version = get_version(os.path.join(here, "perspective", "core", "_version.py"))

SKIP_JS_FILES = os.environ.get("PSP_CI_SKIP_JS_FILES_CHECK")

########################
# Get requirement info #
requires = [
    "Jinja2>=2.0,<4",
    "ipywidgets>=7.5.1,<9",
    "numpy>=1.21.6,<2",
    "pandas>=0.22.0,<3",
    "python-dateutil>=2.8.0,<3",
    "traitlets>=4.3.2,<6",
]

requires_aiohttp = ["aiohttp>=3,<4"]

requires_jupyter = ["jupyterlab>=3.2,<4"]

requires_starlette = ["fastapi>=0.70,<1", "starlette>=0.20,<1"]

requires_tornado = ["tornado>=4.5.3,<7"]

requires_dev = (
    [
        "black==23.1.0",
        "Faker>=1.0.0",
        "flake8>=5",
        "flake8-black>=0.3.3",
        "httpx>=0.23,<1",
        "jupyter_packaging==0.12.3",
        "pip",
        "psutil>=5,<6",
        "pybind11>=2.4.0,<3",
        "pyarrow>=0.16.0",
        "pytest>=4.3.0",
        "pytest-aiohttp>=1",
        "pytest-asyncio>=0.20",
        "pytest-cov>=3",
        "pytest-check-links>=0.7",
        "pytest-tornado>=0.8",
        "pytz>=2022",
        "Sphinx>=1.8.4",
        "sphinx-markdown-builder>=0.5.2",
        "wheel",
    ]
    + requires
    + requires_aiohttp
    + requires_jupyter
    + requires_starlette
    + requires_tornado
)


#####################
# Custom Extensions #
#####################
class PSPExtension(Extension):
    def __init__(self, name, sourcedir="dist"):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)


class PSPBuild(build_ext):
    def run(self):
        self.run_cmake()

    def run_cmake(self):
        self.cmake_cmd = which("cmake")
        try:
            out = subprocess.check_output([self.cmake_cmd, "--version"])
        except OSError:
            raise RuntimeError("CMake must be installed to build the following extensions: " + ", ".join(e.name for e in self.extensions))

        if platform.system() == "Windows":
            cmake_version = LooseVersion(re.search(r"version\s*([\d.]+)", out.decode()).group(1))
            if cmake_version < "3.1.0":
                raise RuntimeError("CMake >= 3.1.0 is required on Windows")

        for ext in self.extensions:
            self.build_extension_cmake(ext)

    def build_extension_cmake(self, ext):
        extdir = os.path.abspath(os.path.dirname(self.get_ext_fullpath(ext.name)))
        cfg = "Debug" if self.debug else "Release"

        PYTHON_VERSION = "{}.{}".format(sys.version_info.major, sys.version_info.minor)

        cmake_args = [
            "-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=" + os.path.abspath(os.path.join(extdir, "perspective", "table")).replace("\\", "/"),
            "-DCMAKE_BUILD_TYPE=" + cfg,
            "-DPSP_CPP_BUILD=1",
            "-DPSP_WASM_BUILD=0",
            "-DPSP_PYTHON_BUILD=1",
            "-DPSP_PYTHON_VERSION={}".format(PYTHON_VERSION),
            "-DPython_ADDITIONAL_VERSIONS={}".format(PYTHON_VERSION),
            "-DPython_FIND_VERSION={}".format(PYTHON_VERSION),
            "-DPython_EXECUTABLE={}".format(sys.executable).replace("\\", "/"),
            "-DPYTHON_LIBRARY={}".format(sysconfig.get_config_var("LIBDIR")).replace("\\", "/"),
            "-DPYTHON_INCLUDE_DIR={}".format(sysconfig.get_config_var("INCLUDEPY")).replace("\\", "/"),
            "-DPython_ROOT_DIR={}".format(sys.prefix).replace("\\", "/"),
            "-DPython_ROOT={}".format(sys.prefix).replace("\\", "/"),
            "-DPSP_CMAKE_MODULE_PATH={folder}".format(folder=os.path.join(ext.sourcedir, "cmake")).replace("\\", "/"),
            "-DPSP_CPP_SRC={folder}".format(folder=ext.sourcedir).replace("\\", "/"),
            "-DPSP_PYTHON_SRC={folder}".format(folder=os.path.join(ext.sourcedir, "..", "perspective").replace("\\", "/")),
        ]

        build_args = ["--config", cfg]
        env = os.environ.copy()

        if platform.system() == "Windows":
            import distutils.msvccompiler as dm

            # https://wiki.python.org/moin/WindowsCompilers#Microsoft_Visual_C.2B-.2B-_14.0_with_Visual_Studio_2015_.28x86.2C_x64.2C_ARM.29
            msvc = {
                "12": "Visual Studio 12 2013",
                "14": "Visual Studio 14 2015",
                "14.0": "Visual Studio 14 2015",
                "14.1": "Visual Studio 15 2017",
                "14.2": "Visual Studio 16 2019",
                "14.3": "Visual Studio 17 2022",
            }.get(dm.get_build_version(), "Visual Studio 15 2017")

            cmake_args.extend(
                [
                    "-DCMAKE_LIBRARY_OUTPUT_DIRECTORY_{}={}".format(cfg.upper(), extdir).replace("\\", "/"),
                    "-G",
                    os.environ.get("PSP_GENERATOR", msvc),
                ]
            )

            vcpkg_toolchain_file = os.path.abspath(
                os.environ.get(
                    "PSP_VCPKG_PATH",
                    os.path.join("..", "..", "vcpkg\\scripts\\buildsystems\\vcpkg.cmake"),
                )
            )

            if os.path.exists(vcpkg_toolchain_file):
                cmake_args.append("-DCMAKE_TOOLCHAIN_FILE={}".format(vcpkg_toolchain_file.replace("\\", "/")))

            if sys.maxsize > 2**32:
                # build 64 bit to match python
                cmake_args += ["-A", "x64"]

            build_args += [
                "--",
                "/m:{}".format(CPU_COUNT),
                "/p:Configuration={}".format(cfg),
            ]
        else:
            cmake_args += ["-DCMAKE_BUILD_TYPE=" + cfg]
            build_args += [
                "--",
                "-j2" if os.environ.get("DOCKER", "") else "-j{}".format(env.get("PSP_NUM_CPUS", CPU_COUNT)),
            ]

        env["PSP_ENABLE_PYTHON"] = "1"
        env["OSX_DEPLOYMENT_TARGET"] = os.environ.get("PSP_OSX_DEPLOYMENT_TARGET", "10.13")
        env["MACOSX_DEPLOYMENT_TARGET"] = os.environ.get("PSP_OSX_DEPLOYMENT_TARGET", "10.13")

        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)

        subprocess.check_call(
            [self.cmake_cmd, os.path.abspath(ext.sourcedir)] + cmake_args,
            cwd=self.build_temp,
            env=env,
            stderr=subprocess.STDOUT,
        )
        subprocess.check_call(
            [self.cmake_cmd, "--build", "."] + build_args,
            cwd=self.build_temp,
            env=env,
            stderr=subprocess.STDOUT,
        )

        # Symlink build_temp to a sibling directory called `last_build` so that we can
        # use it for C++/Python IntelliSense in VSCode.
        if os.name != "nt":
            last_build = os.path.join(os.path.dirname(self.build_temp), "last_build")
            if os.path.exists(last_build):
                os.unlink(last_build)
            os.symlink(os.path.join("..", self.build_temp), last_build)

        print()  # Add an empty line for cleaner output


class PSPCheckSDist(sdist):
    def run(self):
        self.run_check()
        super(PSPCheckSDist, self).run()

    def run_check(self):
        # Check for C++ assets
        for file in ("CMakeLists.txt", "cmake", "src"):
            path = os.path.abspath(os.path.join(here, "dist", file))
            if not os.path.exists(path):
                raise Exception("Path is missing! {}\nMust run `yarn build_python` before building sdist so cmake files are installed".format(path))
        # Check for JS assets
        if not SKIP_JS_FILES:
            for file in ("labextension/package.json", "nbextension/static/index.js"):
                path = os.path.abspath(os.path.join(here, "perspective", file))
                if not os.path.exists(path):
                    raise Exception("Path is missing! {}\nMust run `yarn build` before building sdist so JS files are installed".format(path))


##############################
# NBExtension / Labextension #
##############################
data_files_spec = [
    # NBExtension
    (
        "share/jupyter/nbextensions/@finos/perspective-jupyterlab",
        "perspective/nbextension/static",
        "*.*",
    ),
    # Activate nbextension by default
    (
        "etc/jupyter/nbconfig/notebook.d",
        "perspective/extension",
        "finos-perspective-nbextension.json",
    ),
    # Labextension
    (
        "share/jupyter/labextensions/@finos/perspective-jupyterlab",
        "perspective/labextension",
        "**",
    ),
    # Labextension install command
    (
        "share/jupyter/labextensions/@finos/perspective-jupyterlab",
        "perspective/extension",
        "install.json",
    ),
]

ensured_targets = (
    []
    if SKIP_JS_FILES
    else [
        os.path.join("perspective", "nbextension", "static", "index.js"),
        os.path.join("perspective", "labextension", "package.json"),
        os.path.join("perspective", "labextension", "static", "style.js"),
    ]
)

cmdclass = {}
cmdclass["js"] = wrap_installers(ensured_targets=ensured_targets)
cmdclass["build_ext"] = PSPBuild
cmdclass["sdist"] = PSPCheckSDist


setup(
    name="perspective-python",
    version=version,
    description="Python bindings and JupyterLab integration for Perspective",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/finos/perspective",
    author="Perspective Authors",
    author_email="info@finos.org",
    license="Apache 2.0",
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Framework :: Jupyter :: JupyterLab",
        "Framework :: Jupyter :: JupyterLab :: 3",
        "Framework :: Jupyter :: JupyterLab :: Extensions",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Mime Renderers",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Prebuilt",
    ],
    keywords="analytics tools plotting",
    packages=find_packages(exclude=["bench", "bench.*"]),
    data_files=get_data_files(data_files_spec),
    include_package_data=True,
    zip_safe=False,
    python_requires=">=3.7",
    install_requires=requires,
    extras_require={
        "aiohttp": requires_aiohttp,
        "dev": requires_dev,
        "develop": requires_dev,
        "fastapi": requires_starlette,
        "jupyter": requires_jupyter,
        "starlette": requires_starlette,
        "tornado": requires_tornado,
    },
    ext_modules=[PSPExtension("perspective")],
    cmdclass=cmdclass,
)
