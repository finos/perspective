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

# The regular Python test suite doesn't work in pytest-pyodide --run-in-pyodide,
# for several reasons.
# One: https://github.com/pyodide/pytest-pyodide/issues/81

from pytest_pyodide import run_in_pyodide, spawn_web_server
import pytest


@pytest.fixture(scope="session")
def psp_wheel_path(pytestconfig):
    wheel = pytestconfig.getoption("--perspective-emscripten-wheel")
    if wheel is None:
        raise RuntimeError(
            "pytest option --perspective-emscripten-wheel=<WHEEL> is required but wasn't specified"
        )
    return wheel


# Based on micropip's test server fixture:
# https://github.com/pyodide/micropip/blob/eb8c4497d742e515d24d532db2b9cc014328265b/tests/conftest.py#L64-L87
@pytest.fixture()
def psp_wheel_url(psp_wheel_path):
    from pathlib import Path

    wheel = Path(psp_wheel_path)
    wheels_dir = wheel.parent
    with spawn_web_server(wheels_dir) as server:
        host, port, _ = server
        wheel_url = f"http://{host}:{port}/{wheel.name}"
        yield wheel_url


@pytest.fixture(autouse=True)
@run_in_pyodide(packages=["micropip"])
async def psp_installed(selenium, psp_wheel_url):
    """Installs perspective wheel from rust/target/wheels dir using micropip"""
    # Autoused, so every test has perspective installed without them explicitly listing it as a fixture
    import micropip

    await micropip.install(psp_wheel_url)


@run_in_pyodide
async def test_parsing_bad_csv_raises_exception(selenium):
    import pytest
    import perspective

    server = perspective.Server()
    client = server.new_local_client()
    with pytest.raises(perspective.PerspectiveError) as exc_info:
        client.table("a,b,c\n1,2")
    assert exc_info.match("CSV parse error")


@run_in_pyodide
async def test_parsing_good_csv(selenium):
    import perspective

    server = perspective.Server()
    client = server.new_local_client()
    abc123 = client.table("a,b,c\n1,2,3\n")
    assert abc123.columns() == ["a", "b", "c"]
