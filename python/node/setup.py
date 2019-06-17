# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
from codecs import open
import os
import os.path
import os
import subprocess
import shutil

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

with open(os.path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()

if not os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'perspective', 'setup.py')):
    raise Exception('Must checkout perspective-python submodule')
else:
    with open(os.path.join(os.path.dirname(__file__), '..', 'perspective', 'setup.py')) as fp:
        for line in fp:
            if 'version=\'' in line:
                version = line.strip().replace('version=', '').replace("'", '').replace(',', '')
                print('building version %s' % version)


class JSExtension(Extension):
    def __init__(self, name):
        Extension.__init__(self, name, sources=[])


class JSBuild(build_ext):
    def run(self):
        self.cmd = shutil.which('yarn')
        if not self.cmd:
            self.cmd = shutil.which('npm')
            if not self.cmd:
                raise RuntimeError(
                    "Yarn or npm must be installed to build the following extensions: " +
                    ", ".join(e.name for e in self.extensions))

        try:
            subprocess.check_output([self.cmd, '--version'])
        except OSError:
            raise RuntimeError(
                "Yarn or npm must be installed to build the following extensions: " +
                ", ".join(e.name for e in self.extensions))

        self.build_extension()

    def build_extension(self):
        env = os.environ.copy()
        if not os.path.exists(self.build_temp):
            os.makedirs(self.build_temp)
        install = [self.cmd] if 'yarn' in self.cmd else [self.cmd, 'install']
        build = [self.cmd, 'build'] if 'yarn' in self.cmd else [self.cmd, 'run', 'build']

        subprocess.check_call(install, cwd=self.build_temp, env=env)
        subprocess.check_call(build, cwd=self.build_temp, env=env)
        print()  # Add an empty line for cleaner output


setup(
    name='perspective-python.node',
    version=version,
    description='Analytics library',
    long_description=long_description,
    url='https://github.com/finos/perspective',
    author='Tim Paine',
    author_email='timothy.k.paine@gmail.com',
    license='Apache 2.0',
    install_requires=requires,
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],

    keywords='analytics tools plotting',
    packages=['perspective.node'],
    include_package_data=True,
    zip_safe=False,
    extras_require={'dev': requires + ['pytest', 'pytest-cov', 'pylint', 'flake8', 'mock']},
    ext_modules=[JSExtension('perspective.node')],
    cmdclass=dict(build_ext=JSBuild),
)
