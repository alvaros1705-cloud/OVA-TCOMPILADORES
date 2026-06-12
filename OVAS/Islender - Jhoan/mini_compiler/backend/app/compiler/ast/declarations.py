from typing import List, Any
from .base_node import ASTNode

class Parameter:
    def __init__(self, param_type: str, name: str):
        self.param_type = param_type; self.name = name

class FunctionDecl(ASTNode):
    def __init__(self, name, return_type="void", params=None, body=None, position=None):
        super().__init__(position); self.name=name; self.return_type=return_type
        self.params=params or []; self.body=body or []
    def accept(self, v): return v.visit_function_decl(self)
