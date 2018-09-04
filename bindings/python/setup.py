import os
import os.path
import pathlib
import pprint;
from setuptools import setup, find_packages, Extension
from setuptools.command.build_ext import build_ext as build_ext_orig
from codecs import open

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()


class CMakeExtension(Extension):

    def __init__(self, name):
        # don't invoke the original build_ext for this special extension
        super().__init__(name, sources=[])


class build_ext(build_ext_orig):

    def run(self):
        for ext in self.extensions:
            self.build_cmake(ext)
        super().run()

    def build_cmake(self, ext):
        cwd = pathlib.Path().absolute()

        # these dirs will be created in build_py, so if you don't have
        # any python sources to bundle, the dirs will be missing
        build_temp = pathlib.Path(self.build_temp)
        build_temp.mkdir(parents=True, exist_ok=True)
        extdir = pathlib.Path(self.get_ext_fullpath(ext.name))
        extdir.mkdir(parents=True, exist_ok=True)

        # example of cmake args
        config = 'Debug' if self.debug else 'Release'
        cmake_args = [
            '-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=' + str(os.path.join(extdir.parent.absolute(), 'perspective')),
            '-DCMAKE_BUILD_TYPE=' + config,
        ]

        # example of build args
        build_args = [
            '--config', config,
            '--', '-j2' if os.environ.get('DOCKER', '') else '-j4',
        ]
        os.environ['PSP_ENABLE_PYTHON'] = '1'
        pprint.pprint(os.environ)
        os.chdir(str(build_temp))
        self.spawn(['cmake', str(cwd)] + cmake_args)
        if not self.dry_run:
            self.spawn(['cmake', '--build', '.', ] + build_args)
        os.chdir(str(cwd))


setup(
    name='perspective-python',
    version='0.0.12',
    description='Analytics library',
    long_description=long_description,
    url='https://github.com/timkpaine/perspective-python',
    download_url='https://github.com/timkpaine/perspective-python/archive/v0.0.12.tar.gz',
    author='Tim Paine',
    author_email='timothy.k.paine@gmail.com',
    license='Apache 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],

    keywords='analytics tools plotting',
    # packages=find_packages(exclude=['tests', ]),
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    ext_modules=[
        CMakeExtension('perspective')
    ],
    cmdclass={
        'build_ext': build_ext,
    }
)
