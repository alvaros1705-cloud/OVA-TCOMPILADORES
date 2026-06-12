from dataclasses import dataclass
from typing import Optional

@dataclass
class Quadruple:
    op: str
    arg1: Optional[str]
    arg2: Optional[str]
    result: str

    def __repr__(self):
        return f"({self.op}, {self.arg1 or '_'}, {self.arg2 or '_'}, {self.result})"
