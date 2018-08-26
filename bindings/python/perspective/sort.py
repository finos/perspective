from enum import Enum


class Sort(Enum):
    ASC = 'asc'
    ASC_ABS = 'asc abs'
    DESC = 'desc'
    DESC_ABS = 'desc abs'
    NONE = 'none'

    @staticmethod
    def options():
        return list(map(lambda c: c.value, Sort))
