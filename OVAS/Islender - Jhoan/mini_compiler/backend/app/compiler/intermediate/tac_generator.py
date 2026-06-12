from typing import List
from ..ast import *
from .ir_nodes import Quadruple

class TACGenerator:
    """Generador de código de tres direcciones (cuádruplas)."""

    def __init__(self):
        self.quads: List[Quadruple] = []
        self._temp_count = 0
        self._label_count = 0

    def generate(self, node: ASTNode) -> List[Quadruple]:
        node.accept(self)
        return self.quads

    def _new_temp(self) -> str:
        self._temp_count += 1
        return f"t{self._temp_count}"

    def _new_label(self) -> str:
        self._label_count += 1
        return f"L{self._label_count}"

    def _emit(self, op, arg1=None, arg2=None, result=None) -> str:
        self.quads.append(Quadruple(op, arg1, arg2, result or ""))
        return result

    # ── visitors ──────────────────────────────────────────────────────────
    def visit_program(self, node: ProgramNode):
        for s in node.statements: s.accept(self)

    def visit_function_decl(self, node: FunctionDecl):
        self._emit("FUNC_BEGIN", node.name, result=f"func_{node.name}")
        for p in node.params:
            self._emit("PARAM", p.name)
        for s in node.body:
            s.accept(self)
        self._emit("FUNC_END", node.name)

    def visit_var_declaration(self, node: VarDeclaration):
        if node.initializer:
            val = node.initializer.accept(self)
            self._emit("=", val, result=node.name)
        else:
            self._emit("DECL", node.var_type, result=node.name)

    def visit_assign_statement(self, node: AssignStatement):
        val = node.value.accept(self)
        self._emit("=", val, result=node.name)

    def visit_assignment_expr(self, node: AssignmentExpr):
        val = node.value.accept(self)
        self._emit("=", val, result=node.name)
        return node.name

    def visit_binary_op(self, node: BinaryOp) -> str:
        l = node.left.accept(self)
        r = node.right.accept(self)
        t = self._new_temp()
        self._emit(node.operator, l, r, t)
        return t

    def visit_unary_op(self, node: UnaryOp) -> str:
        op = node.operand.accept(self)
        t = self._new_temp()
        self._emit(f"UNARY_{node.operator}", op, result=t)
        return t

    def visit_if_statement(self, node: IfStatement):
        cond = node.condition.accept(self)
        else_lbl = self._new_label()
        end_lbl = self._new_label()
        self._emit("IF_FALSE", cond, result=else_lbl)
        for s in node.then_branch: s.accept(self)
        self._emit("GOTO", result=end_lbl)
        self._emit("LABEL", result=else_lbl)
        if node.else_branch:
            for s in node.else_branch: s.accept(self)
        self._emit("LABEL", result=end_lbl)

    def visit_while_statement(self, node: WhileStatement):
        start_lbl = self._new_label()
        end_lbl = self._new_label()
        self._emit("LABEL", result=start_lbl)
        cond = node.condition.accept(self)
        self._emit("IF_FALSE", cond, result=end_lbl)
        for s in node.body: s.accept(self)
        self._emit("GOTO", result=start_lbl)
        self._emit("LABEL", result=end_lbl)

    def visit_for_statement(self, node: ForStatement):
        if node.init: node.init.accept(self)
        start_lbl = self._new_label()
        end_lbl = self._new_label()
        self._emit("LABEL", result=start_lbl)
        if node.condition:
            cond = node.condition.accept(self)
            self._emit("IF_FALSE", cond, result=end_lbl)
        for s in node.body: s.accept(self)
        if node.update: node.update.accept(self)
        self._emit("GOTO", result=start_lbl)
        self._emit("LABEL", result=end_lbl)

    def visit_return_statement(self, node: ReturnStatement):
        if node.value:
            val = node.value.accept(self)
            self._emit("RETURN", val)
        else:
            self._emit("RETURN")

    def visit_print_statement(self, node: PrintStatement):
        val = node.value.accept(self)
        self._emit("PRINT", val)

    def visit_expr_statement(self, node: ExprStatement):
        node.expression.accept(self)

    def visit_block(self, node: Block):
        for s in node.statements: s.accept(self)

    def visit_function_call(self, node: FunctionCall) -> str:
        for arg in node.arguments:
            v = arg.accept(self)
            self._emit("ARG", v)
        t = self._new_temp()
        self._emit("CALL", node.name, str(len(node.arguments)), t)
        return t

    def visit_integer_literal(self, node) -> str: return str(node.value)
    def visit_float_literal(self, node) -> str: return str(node.value)
    def visit_string_literal(self, node) -> str: return f'"{node.value}"'
    def visit_boolean_literal(self, node) -> str: return "true" if node.value else "false"
    def visit_identifier(self, node: IdentifierNode) -> str: return node.name
