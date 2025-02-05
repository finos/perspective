# pyodide-tests

Smoke and integration tests for the perspective-python Pyodide wheel. The tests
are specced in `pytest` and executed with `playwright`, using the
`pytest-pyodide` package.

These tests require that a Pyodide wheel has been built to rust/target/wheels

## test setup

Create a virtual environment. Install perspective-python requirements and
special pyodide-only requirements:

```
pip install -r rust/perspective-python/requirements.txt
pip install -r rust/perspective-python/requirements-pyodide.txt
```

## running tests

Run setup, select `perspective-pyodide` target:

```
pnpm -w run setup
```

Build the pyodide wheel:

```
PSP_BUILD_WHEEL=1 pnpm -w run build
```

Then run tests:

```
pnpm -w test
```

If you are prompted to install playwright browsers, run this in your venv:

```
python -m playwright install
```
