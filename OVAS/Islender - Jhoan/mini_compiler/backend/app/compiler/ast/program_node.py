from typing import List
from .base_node import ASTNode

class ProgramNode(ASTNode):
    def __init__(self, statements=None, position=None):
        super().__init__(position); self.statements=statements or []
    def accept(self, visitor): return visitor.visit_program(self)
