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

# As of Feb 2025, the regular Python test suite doesn't work in pytest-pyodide
# --run-in-pyodide, for several reasons.
# One: https://github.com/pyodide/pytest-pyodide/issues/81
#

# These pytest-pyodide tests are still quirky.  Be wary of trying to split into
# several files: relative imports will break, things seem to work best contained in
# one python module.

from pytest_pyodide import run_in_pyodide, spawn_web_server
import pytest


#  __________
# < FIXTURES >
#  ----------
#         \   ^__^
#          \  (oo)\_______
#             (__)\       )\/\
#                 ||----w |
#                 ||     ||


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
# Run web server serving the directory containing the perspective wheel,
# yielding the wheel's URL for the fixture value
# FIXME: Try using https://github.com/pyodide/pytest-pyodide/tree/main?tab=readme-ov-file#copying-files-to-pyodide
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


@pytest.fixture
@run_in_pyodide
def server(selenium):
    from perspective import Server
    from pytest_pyodide.decorator import PyodideHandle

    s = Server()
    return PyodideHandle(s)


@pytest.fixture
@run_in_pyodide
def client(selenium, psp_installed, server):
    from perspective import AsyncClient
    from pytest_pyodide.decorator import PyodideHandle

    import asyncio

    async def send_request(msg):
        sess.handle_request(msg)

    def send_response(msg):
        async def poke_client():
            await client.handle_response(msg)

        asyncio.get_running_loop().create_task(poke_client())

    sess = server.new_session(send_response)
    client = AsyncClient(send_request)
    return PyodideHandle(client)


#  _________
# < PYTESTS >
#  ---------
#         \   ^__^
#          \  (oo)\_______
#             (__)\       )\/\
#                 ||----w |
#                 ||     ||


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


# Test that perspective can load pyarrow Table values
@run_in_pyodide
async def test_perspective_and_pyarrow_together_at_last(selenium):
    import micropip

    await micropip.install("pyarrow")

    import perspective
    import pyarrow as pa

    n_legs = pa.array([2, 2, 4, 4, 5, 100])
    animals = pa.array(
        ["Flamingo", "Parrot", "Dog", "Horse", "Brittle stars", "Centipede"]
    )
    names = ["n_legs", "animals"]
    table = pa.Table.from_arrays([n_legs, animals], names=names)

    server = perspective.Server()
    client = server.new_local_client()

    animals = client.table(table, name="animals")
    assert animals.columns() == ["n_legs", "animals"]


# Test that perspective can load pandas DataFrame values
@run_in_pyodide
async def test_pandas_dataframes(selenium):
    import micropip

    await micropip.install(["pyarrow", "pandas"])

    import perspective
    import pandas as pd

    server = perspective.Server()
    client = server.new_local_client()
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    ab = client.table(df, name="ab")
    assert sorted(ab.columns()) == ["a", "b", "index"]


@run_in_pyodide
async def test_async_client_kitchen_sink(selenium, client):
    """run various things on the async client"""

    from unittest.mock import Mock
    from perspective import PerspectiveError
    import pytest

    table = await client.table({"a": [0]}, name="my-cool-data", limit=100)
    view = await table.view()
    # synchronous methods
    assert table.get_index() is None
    assert table.get_name() == "my-cool-data"
    limit = table.get_limit()
    assert limit == 100

    # view update callbacks
    view_updated = Mock()
    await view.on_update(view_updated)
    for i in range(1, limit):
        await table.update([{"a": i}])
        await table.size()  # force update to process
    assert (await table.size()) == limit
    assert view_updated.call_count == limit - 1
    rex = await view.to_records()
    assert rex == [{"a": i} for i in range(limit)]

    # view/table delete callbacks
    view_deleted = Mock()
    table_deleted = Mock()
    await table.on_delete(table_deleted)
    await view.on_delete(view_deleted)
    with pytest.raises(PerspectiveError) as excinfo:
        await table.delete()
    assert excinfo.match(r"Cannot delete table with views")
    await view.delete()
    view_deleted.assert_called_once()
    await table.delete()
    table_deleted.assert_called_once()

    # Cleaning up the client fixture's PyodideHandle causes pytest to
    # spew some nasty errors on exit.  Seems like playwright's shutdown and
    # deletion of the PyodideHandle are racing, and PyodideHandle's finalizer
    # throws trying to execute code in the playwright browser which has already
    # stopped its event loop.
    # TODO: File bug on pytest-pyodide
    #
    # Exception ignored in: <function PyodideHandle.__del__ at 0x7b9df0c7a710>
    # playwright._impl._errors.Error: Event loop is closed! Is Playwright already stopped?
