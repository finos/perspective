import asyncio
from datetime import datetime, timedelta
from random import sample, choice
from string import ascii_letters
from threading import Thread


async def datagen(
    client, name: str = "data_source_one", size: int = 10, interval: int = 3
):
    table = client.table(
        {
            "a": "integer",
            "b": "float",
            "c": "string",
            "d": "boolean",
            "e": "datetime",
        },
        name=name,
    )
    size = 10
    for i in range(size):
        a = [*range(i * size, (i + 1) * size)]
        b = [float(_) for _ in range(i * size, (i + 1) * size)]
        c = ["".join(sample(ascii_letters, 5)) for _ in range(size)]
        d = [choice((True, False)) for _ in range(size)]
        e = [
            (datetime.now() + timedelta(milliseconds=_)).isoformat()
            for _ in range(i * size, (i + 1) * size)
        ]
        table.update(
            {
                "a": a,
                "b": b,
                "c": c,
                "d": d,
                "e": e,
            }
        )
        await asyncio.sleep(5)


def run_datagen(*args, **kwargs):
    return Thread(
        target=asyncio.run, args=(datagen(*args, **kwargs),), daemon=True
    ).start()
