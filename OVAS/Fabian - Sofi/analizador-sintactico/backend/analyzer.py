import difflib
from typing import List, Dict, Any, Tuple
from backend.ast_nodes import Node, ProgramNode, AssignNode, BinOpNode, VarNode, NumNode

class ASTAnalyzer:
    def __init__(self):
        self.symbols = {}
        self.errors = []

    def error(self, message: str, node: Node, suggestion: str = ""):
        self.errors.append({
            "type": "Semantico",
            "message": message,
            "line": node.line,
            "column": node.col,
            "start_idx": node.start_idx,
            "end_idx": node.end_idx,
            "suggestion": suggestion or "Verifica la logica de la expresion."
        })

    def analyze(self, root: ProgramNode) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        self.symbols = {}
        self.errors = []

        if not root or not hasattr(root, 'statements'):
            return [], []

        for stmt in root.statements:
            self.visit(stmt)

        symbol_list = []
        for name, info in self.symbols.items():
            symbol_list.append({
                "name": name,
                "type": info["type"],
                "value": str(info["value"]) if info["is_constant"] and info["value"] is not None else "Dinamico",
                "is_constant": info["is_constant"],
                "line": info["line"],
                "column": info["column"],
                "history": info["history"]
            })

        return symbol_list, self.errors

    def visit(self, node: Node):
        if isinstance(node, AssignNode):
            self.visit_assign(node)
        elif isinstance(node, BinOpNode) or isinstance(node, VarNode) or isinstance(node, NumNode):
            self.visit_expr(node)

    def visit_assign(self, node: AssignNode):
        self.visit_expr(node.expression)
        val, is_const = self.evaluate(node.expression)

        inferred_type = "Entero"
        if val is not None:
            if isinstance(val, float):
                inferred_type = "Real"
            elif isinstance(val, int):
                inferred_type = "Entero"
        else:
            inferred_type = self.infer_dynamic_type(node.expression)

        var_name = node.var_name
        history_entry = {
            "line": node.line,
            "column": node.col,
            "value": str(val) if is_const and val is not None else "Valor Dinamico"
        }

        if var_name in self.symbols:
            self.symbols[var_name]["value"] = val if is_const else None
            self.symbols[var_name]["is_constant"] = is_const
            self.symbols[var_name]["type"] = inferred_type
            self.symbols[var_name]["history"].append(history_entry)
        else:
            self.symbols[var_name] = {
                "type": inferred_type,
                "value": val if is_const else None,
                "is_constant": is_const,
                "line": node.line,
                "column": node.col,
                "history": [history_entry]
            }

    def visit_expr(self, node: Node):
        if isinstance(node, VarNode):
            if node.name not in self.symbols:
                known_vars = list(self.symbols.keys())
                closest = difflib.get_close_matches(node.name, known_vars, n=1, cutoff=0.5)
                suggestion = f"Define la variable '{node.name}' antes de usarla."
                if closest:
                    suggestion += f" Quisiste decir '{closest[0]}'?"

                self.error(f"Variable '{node.name}' no definida.", node, suggestion)

        elif isinstance(node, BinOpNode):
            self.visit_expr(node.left)
            self.visit_expr(node.right)

            if node.op == '/':
                r_val, r_const = self.evaluate(node.right)
                if r_const and r_val == 0:
                    self.error("Division por cero detectada.", node.right, "El divisor debe ser diferente de cero.")

    def evaluate(self, node: Node) -> Tuple[Any, bool]:
        if isinstance(node, NumNode):
            return node.value, True

        elif isinstance(node, VarNode):
            if node.name in self.symbols and self.symbols[node.name]["is_constant"]:
                val = self.symbols[node.name]["value"]
                if val is not None:
                    return val, True
            return None, False

        elif isinstance(node, BinOpNode):
            l_val, l_const = self.evaluate(node.left)
            r_val, r_const = self.evaluate(node.right)

            if l_const and r_const and l_val is not None and r_val is not None:
                try:
                    if node.op == '+':
                        return l_val + r_val, True
                    elif node.op == '-':
                        return l_val - r_val, True
                    elif node.op == '*':
                        return l_val * r_val, True
                    elif node.op == '/':
                        if r_val == 0:
                            return None, False
                        return l_val / r_val, True
                except Exception:
                    return None, False
            return None, False

        return None, False

    def infer_dynamic_type(self, node: Node) -> str:
        if isinstance(node, NumNode):
            return "Real" if isinstance(node.value, float) else "Entero"
        elif isinstance(node, VarNode):
            if node.name in self.symbols:
                return self.symbols[node.name]["type"]
            return "Entero"
        elif isinstance(node, BinOpNode):
            l_type = self.infer_dynamic_type(node.left)
            r_type = self.infer_dynamic_type(node.right)
            if node.op == '/':
                return "Real"
            if l_type == "Real" or r_type == "Real":
                return "Real"
            return "Entero"
        return "Entero"
