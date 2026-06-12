from dataclasses import dataclass
from .token_types import TokenType
from .position import Position

@dataclass
class Token:
    type: TokenType
    value: str
    position: Position

    def __repr__(self):
        return f"Token({self.type.name}, {self.value!r}, {self.position})"

    def is_type(self, *types: TokenType) -> bool:
        return self.type in types
