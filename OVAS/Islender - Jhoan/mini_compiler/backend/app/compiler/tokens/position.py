from dataclasses import dataclass

@dataclass
class Position:
    line: int
    column: int
    index: int = 0

    def __repr__(self):
        return f"({self.line}:{self.column})"

    def copy(self):
        return Position(self.line, self.column, self.index)
