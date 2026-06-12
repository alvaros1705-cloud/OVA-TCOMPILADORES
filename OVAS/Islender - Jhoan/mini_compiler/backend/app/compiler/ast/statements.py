from typing import List, Optional, Any
from .base_node import ASTNode

class VarDeclaration(ASTNode):
    def __init__(self, var_type, name, initializer=None, position=None):
        super().__init__(position); self.var_type=var_type; self.name=name; self.initializer=initializer
    def accept(self, v): return v.visit_var_declaration(self)

class AssignStatement(ASTNode):
    def __init__(self, name, value, position=None):
        super().__init__(position); self.name=name; self.value=value
    def accept(self, v): return v.visit_assign_statement(self)

class IfStatement(ASTNode):
    def __init__(self, condition, then_branch=None, else_branch=None, position=None):
        super().__init__(position); self.condition=condition
        self.then_branch=then_branch or []; self.else_branch=else_branch
    def accept(self, v): return v.visit_if_statement(self)

class WhileStatement(ASTNode):
    def __init__(self, condition, body=None, position=None):
        super().__init__(position); self.condition=condition; self.body=body or []
    def accept(self, v): return v.visit_while_statement(self)

class ForStatement(ASTNode):
    def __init__(self, init=None, condition=None, update=None, body=None, position=None):
        super().__init__(position); self.init=init; self.condition=condition
        self.update=update; self.body=body or []
    def accept(self, v): return v.visit_for_statement(self)

class ReturnStatement(ASTNode):
    def __init__(self, value=None, position=None):
        super().__init__(position); self.value=value
    def accept(self, v): return v.visit_return_statement(self)

class PrintStatement(ASTNode):
    def __init__(self, value=None, position=None):
        super().__init__(position); self.value=value
    def accept(self, v): return v.visit_print_statement(self)

class ExprStatement(ASTNode):
    def __init__(self, expression=None, position=None):
        super().__init__(position); self.expression=expression
    def accept(self, v): return v.visit_expr_statement(self)

class Block(ASTNode):
    def __init__(self, statements=None, position=None):
        super().__init__(position); self.statements=statements or []
    def accept(self, v): return v.visit_block(self)
