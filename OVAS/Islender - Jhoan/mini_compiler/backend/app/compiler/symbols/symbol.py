from dataclasses import dataclass
from typing import Optional

@dataclass
class Symbol:
    name: str
    symbol_type: str
    scope_level: int = 0
    position: Optional[object] = None

    def __repr__(self):
        return f"Symbol({self.name}: {self.symbol_type})"
