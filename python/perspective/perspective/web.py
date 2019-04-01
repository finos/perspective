from .base import PerspectiveBaseMixin


class PerspectiveHTTPMixin(object):
    def loadData(self, **kwargs):
        self.psp = PerspectiveBaseMixin()
        self.psp.setup(**kwargs)

    def getData(self, data_only=False):
        return self.psp._as_json(data_only=data_only, allow_nan=False)
