from .base_node import ASTNode

class IntegerLiteral(ASTNode):
    def __init__(self, value: int, position=None):
        super().__init__(position)
        self.value = value
    def accept(self, v): return v.visit_integer_literal(self)

class FloatLiteral(ASTNode):
    def __init__(self, value: float, position=None):
        super().__init__(position)
        self.value = value
    def accept(self, v): return v.visit_float_literal(self)

class StringLiteral(ASTNode):
    def __init__(self, value: str, position=None):
        super().__init__(position)
        self.value = value
    def accept(self, v): return v.visit_string_literal(self)

class BooleanLiteral(ASTNode):
    def __init__(self, value: bool, position=None):
        super().__init__(position)
        self.value = value
    def accept(self, v): return v.visit_boolean_literal(self)

class IdentifierNode(ASTNode):
    def __init__(self, name: str, position=None):
        super().__init__(position)
        self.name = name
    def accept(self, v): return v.visit_identifier(self)
