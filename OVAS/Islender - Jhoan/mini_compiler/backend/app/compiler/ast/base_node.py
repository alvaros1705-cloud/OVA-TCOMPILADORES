from abc import ABC, abstractmethod
from typing import Any, Optional

class ASTNode(ABC):
    def __init__(self, position=None):
        self.position = position

    @abstractmethod
    def accept(self, visitor):
        pass
