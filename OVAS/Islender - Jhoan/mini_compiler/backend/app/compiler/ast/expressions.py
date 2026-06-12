from typing import List, Any
from .base_node import ASTNode

class BinaryOp(ASTNode):
    def __init__(self, operator, left, right, position=None):
        super().__init__(position); self.operator=operator; self.left=left; self.right=right
    def accept(self, v): return v.visit_binary_op(self)

class UnaryOp(ASTNode):
    def __init__(self, operator, operand, position=None):
        super().__init__(position); self.operator=operator; self.operand=operand
    def accept(self, v): return v.visit_unary_op(self)

class FunctionCall(ASTNode):
    def __init__(self, name, arguments=None, position=None):
        super().__init__(position); self.name=name; self.arguments=arguments or []
    def accept(self, v): return v.visit_function_call(self)

class AssignmentExpr(ASTNode):
    def __init__(self, name, value, position=None):
        super().__init__(position); self.name=name; self.value=value
    def accept(self, v): return v.visit_assignment_expr(self)
