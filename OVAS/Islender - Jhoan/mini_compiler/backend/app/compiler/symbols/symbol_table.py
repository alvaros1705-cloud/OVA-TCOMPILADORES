from typing import List, Optional
from .scope import Scope
from .symbol import Symbol

class SymbolTable:
    def __init__(self):
        self.global_scope = Scope("global", level=0)
        self._scope_stack: List[Scope] = [self.global_scope]

    @property
    def current_scope(self) -> Scope:
        return self._scope_stack[-1]

    def enter_scope(self, name: str = "block"):
        new_scope = Scope(name, parent=self.current_scope, level=len(self._scope_stack))
        self._scope_stack.append(new_scope)
        return new_scope

    def exit_scope(self):
        if len(self._scope_stack) > 1:
            return self._scope_stack.pop()

    def define(self, symbol: Symbol):
        self.current_scope.define(symbol)

    def lookup(self, name: str) -> Optional[Symbol]:
        return self.current_scope.lookup(name)

    def lookup_local(self, name: str) -> Optional[Symbol]:
        return self.current_scope.lookup_local(name)

    def to_dict(self) -> dict:
        def scope_to_dict(scope: Scope) -> dict:
            return {
                "name": scope.name,
                "level": scope.level,
                "symbols": {n: {"type": s.symbol_type} for n, s in scope._symbols.items()}
            }
        return scope_to_dict(self.global_scope)
