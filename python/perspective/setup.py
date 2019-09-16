from setuptools import setup, find_packages
from codecs import open
import os
import os.path

here = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

with open(os.path.join(here, 'requirements.txt'), encoding='utf-8') as f:
    requires = f.read().split()

setup(
    name='perspective-python',
    version='0.1.12',
    description='Analytics library',
    long_description=long_description,
    url='https://github.com/timkpaine/perspective-python',
    download_url='https://github.com/timkpaine/perspective-python/archive/v0.1.12.tar.gz',
    author='Tim Paine',
    author_email='timothy.k.paine@gmail.com',
    license='Apache 2.0',
    install_requires=requires,
    extras_require={'dev': requires + ['pytest', 'pytest-cov', 'pylint', 'flake8', 'bumpversion']},
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
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
)
