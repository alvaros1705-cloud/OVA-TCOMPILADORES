from typing import List
from ..ast import *
from ..symbols import Symbol, SymbolTable
from ..errors.semantic_error import SemanticError

TYPE_COMPAT = {
    ("int", "int"): "int",
    ("float", "float"): "float",
    ("int", "float"): "float",
    ("float", "int"): "float",
    ("string", "string"): "string",
    ("bool", "bool"): "bool",
}

class SemanticAnalyzer:
    def __init__(self):
        self.table = SymbolTable()
        self.errors: List[SemanticError] = []
        self._current_function_return = None

    def analyze(self, node: ASTNode):
        node.accept(self)
        return self.table

    # ── visitor methods ──────────────────────────────────────────────────
    def visit_program(self, node: ProgramNode):
        for stmt in node.statements:
            stmt.accept(self)

    def visit_function_decl(self, node: FunctionDecl):
        if self.table.lookup_local(node.name):
            self._error(f"Función '{node.name}' ya declarada", node.position)
            return
        self.table.define(Symbol(node.name, f"func:{node.return_type}", position=node.position))
        self.table.enter_scope(f"func:{node.name}")
        prev = self._current_function_return
        self._current_function_return = node.return_type
        for p in node.params:
            self.table.define(Symbol(p.name, p.param_type))
        for stmt in node.body:
            stmt.accept(self)
        self._current_function_return = prev
        self.table.exit_scope()

    def visit_var_declaration(self, node: VarDeclaration):
        if self.table.lookup_local(node.name):
            self._error(f"Variable '{node.name}' ya declarada en este scope", node.position)
            return
        if node.initializer:
            init_type = node.initializer.accept(self)
            if init_type and not self._compatible(node.var_type, init_type):
                self._error(f"Tipo incompatible: '{node.var_type}' != '{init_type}'", node.position)
        self.table.define(Symbol(node.name, node.var_type, position=node.position))

    def visit_assign_statement(self, node: AssignStatement):
        sym = self.table.lookup(node.name)
        if not sym:
            self._error(f"Variable '{node.name}' no declarada", node.position)
            return
        val_type = node.value.accept(self)
        if val_type and not self._compatible(sym.symbol_type, val_type):
            self._error(f"No se puede asignar '{val_type}' a '{sym.symbol_type}'", node.position)

    def visit_assignment_expr(self, node: AssignmentExpr):
        sym = self.table.lookup(node.name)
        if not sym:
            self._error(f"Variable '{node.name}' no declarada", node.position)
            return None
        return sym.symbol_type

    def visit_if_statement(self, node: IfStatement):
        cond_type = node.condition.accept(self)
        if cond_type and cond_type != "bool":
            self._error("La condición del if debe ser bool", node.position)
        self.table.enter_scope("if")
        for s in node.then_branch: s.accept(self)
        self.table.exit_scope()
        if node.else_branch:
            self.table.enter_scope("else")
            for s in node.else_branch: s.accept(self)
            self.table.exit_scope()

    def visit_while_statement(self, node: WhileStatement):
        cond_type = node.condition.accept(self)
        if cond_type and cond_type != "bool":
            self._error("La condición del while debe ser bool", node.position)
        self.table.enter_scope("while")
        for s in node.body: s.accept(self)
        self.table.exit_scope()

    def visit_for_statement(self, node: ForStatement):
        self.table.enter_scope("for")
        if node.init: node.init.accept(self)
        if node.condition: node.condition.accept(self)
        if node.update: node.update.accept(self)
        for s in node.body: s.accept(self)
        self.table.exit_scope()

    def visit_return_statement(self, node: ReturnStatement):
        if node.value:
            ret_type = node.value.accept(self)
            if self._current_function_return and ret_type:
                if not self._compatible(self._current_function_return, ret_type):
                    self._error(f"Tipo de retorno incorrecto: se esperaba '{self._current_function_return}'", node.position)

    def visit_print_statement(self, node: PrintStatement):
        node.value.accept(self)

    def visit_expr_statement(self, node: ExprStatement):
        node.expression.accept(self)

    def visit_block(self, node: Block):
        self.table.enter_scope("block")
        for s in node.statements: s.accept(self)
        self.table.exit_scope()

    def visit_binary_op(self, node: BinaryOp) -> str:
        left = node.left.accept(self)
        right = node.right.accept(self)
        if node.operator in ("==", "!=", "<", ">", "<=", ">=", "&&", "||"):
            return "bool"
        if left and right:
            result = TYPE_COMPAT.get((left, right))
            if not result:
                self._error(f"Operación '{node.operator}' no válida entre '{left}' y '{right}'", node.position)
            return result
        return left or right

    def visit_unary_op(self, node: UnaryOp) -> str:
        t = node.operand.accept(self)
        if node.operator == "!" and t != "bool":
            self._error("El operador '!' requiere bool", node.position)
        return t

    def visit_function_call(self, node: FunctionCall) -> str:
        sym = self.table.lookup(node.name)
        if not sym:
            self._error(f"Función '{node.name}' no declarada", node.position)
            return None
        for arg in node.arguments:
            arg.accept(self)
        if sym.symbol_type.startswith("func:"):
            return sym.symbol_type.split(":")[1]
        return None

    def visit_integer_literal(self, node) -> str: return "int"
    def visit_float_literal(self, node) -> str: return "float"
    def visit_string_literal(self, node) -> str: return "string"
    def visit_boolean_literal(self, node) -> str: return "bool"

    def visit_identifier(self, node: IdentifierNode) -> str:
        sym = self.table.lookup(node.name)
        if not sym:
            self._error(f"Variable '{node.name}' no declarada", node.position)
            return None
        return sym.symbol_type

    # ── helpers ───────────────────────────────────────────────────────────
    def _compatible(self, t1: str, t2: str) -> bool:
        if t1 == t2: return True
        return (t1, t2) in TYPE_COMPAT

    def _error(self, msg: str, pos=None):
        self.errors.append(SemanticError(msg, pos))
