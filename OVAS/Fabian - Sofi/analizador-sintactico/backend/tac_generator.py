from backend.ast_nodes import Node, ProgramNode, AssignNode, BinOpNode, VarNode, NumNode

class TACGenerator:
    def __init__(self):
        self.temp_counter = 0
        self.instructions = []

    def new_temp(self) -> str:
        temp_name = f"t{self.temp_counter}"
        self.temp_counter += 1
        return temp_name

    def generate(self, root: Node) -> list:
        self.instructions = []
        self.temp_counter = 0
        self.visit(root)
        return self.instructions

    def visit(self, node: Node) -> str:
        if isinstance(node, ProgramNode):
            for stmt in node.statements:
                self.visit(stmt)
            return ""

        elif isinstance(node, AssignNode):
            expr_val = self.visit(node.expression)
            self.instructions.append(f"{node.var_name} = {expr_val}")
            return node.var_name

        elif isinstance(node, BinOpNode):
            left_val = self.visit(node.left)
            right_val = self.visit(node.right)
            temp = self.new_temp()
            self.instructions.append(f"{temp} = {left_val} {node.op} {right_val}")
            return temp

        elif isinstance(node, VarNode):
            return node.name

        elif isinstance(node, NumNode):
            return str(node.value)

        return ""
