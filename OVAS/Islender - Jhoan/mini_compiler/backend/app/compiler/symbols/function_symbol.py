from .symbol import Symbol
class FunctionSymbol(Symbol):
    def __init__(self, name, return_type, params=None, **kwargs):
        super().__init__(name, f"func:{return_type}", **kwargs)
        self.return_type = return_type
        self.params = params or []
