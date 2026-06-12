from typing import List, Union, Dict, Any

class Node:
    def __init__(self, node_id: int, node_type: str, label: str, line: int, col: int, start_idx: int, end_idx: int):
        self.id = node_id
        self.type = node_type
        self.label = label
        self.line = line
        self.col = col
        self.start_idx = start_idx
        self.end_idx = end_idx

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "label": self.label,
            "line": self.line,
            "col": self.col,
            "start_idx": self.start_idx,
            "end_idx": self.end_idx,
            "children": []
        }

class ProgramNode(Node):
    def __init__(self, node_id: int, statements: List[Node], line: int, col: int, start_idx: int, end_idx: int):
        super().__init__(node_id, "Program", "Programa", line, col, start_idx, end_idx)
        self.statements = statements

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["children"] = [stmt.to_dict() for stmt in self.statements]
        return d

class AssignNode(Node):
    def __init__(self, node_id: int, var_name: str, expression: Node, line: int, col: int, start_idx: int, end_idx: int):
        super().__init__(node_id, "Assign", f"{var_name} =", line, col, start_idx, end_idx)
        self.var_name = var_name
        self.expression = expression

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["children"] = [
            {
                "id": f"{self.id}_var",
                "type": "Variable",
                "label": self.var_name,
                "line": self.line,
                "col": self.col,
                "start_idx": self.start_idx,
                "end_idx": self.start_idx + len(self.var_name),
                "children": []
            },
            self.expression.to_dict()
        ]
        return d

class BinOpNode(Node):
    def __init__(self, node_id: int, op: str, left: Node, right: Node, line: int, col: int, start_idx: int, end_idx: int):
        super().__init__(node_id, "BinOp", op, line, col, start_idx, end_idx)
        self.op = op
        self.left = left
        self.right = right

    def to_dict(self) -> Dict[str, Any]:
        d = super().to_dict()
        d["children"] = [self.left.to_dict(), self.right.to_dict()]
        return d

class VarNode(Node):
    def __init__(self, node_id: int, name: str, line: int, col: int, start_idx: int, end_idx: int):
        super().__init__(node_id, "Variable", name, line, col, start_idx, end_idx)
        self.name = name

class NumNode(Node):
    def __init__(self, node_id: int, value: Union[int, float], line: int, col: int, start_idx: int, end_idx: int):
        super().__init__(node_id, "Number", str(value), line, col, start_idx, end_idx)
        self.value = value
