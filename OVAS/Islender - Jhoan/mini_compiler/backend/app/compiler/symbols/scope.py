from typing import Dict, Optional
from .symbol import Symbol

class Scope:
    def __init__(self, name: str, parent: Optional['Scope'] = None, level: int = 0):
        self.name = name
        self.parent = parent
        self.level = level
        self._symbols: Dict[str, Symbol] = {}

    def define(self, symbol: Symbol):
        self._symbols[symbol.name] = symbol

    def lookup_local(self, name: str) -> Optional[Symbol]:
        return self._symbols.get(name)

    def lookup(self, name: str) -> Optional[Symbol]:
        sym = self._symbols.get(name)
        if sym:
            return sym
        if self.parent:
            return self.parent.lookup(name)
        return None

    def __contains__(self, name: str):
        return name in self._symbols
