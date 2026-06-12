from typing import List, Dict, Any, Tuple
from backend.lexer import Token
from backend.ast_nodes import Node, ProgramNode, AssignNode, BinOpNode, VarNode, NumNode

class ParseError(Exception):
    def __init__(self, message: str, token: Token):
        super().__init__(message)
        self.token = token


class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0
        self.errors = []
        self.trace = []
        self._node_id_counter = 0

    def next_node_id(self) -> int:
        self._node_id_counter += 1
        return self._node_id_counter

    @property
    def current_token(self) -> Token:
        if self.pos < len(self.tokens):
            return self.tokens[self.pos]
        return self.tokens[-1]

    def peek(self, offset: int = 1) -> Token:
        index = self.pos + offset
        if index < len(self.tokens):
            return self.tokens[index]
        return self.tokens[-1]

    def consume(self) -> Token:
        token = self.current_token
        if token.type != 'EOF':
            self.pos += 1
        self.record_trace("consume", {"token": token.to_dict()})
        return token

    def match(self, expected_type: str) -> Token:
        token = self.current_token
        if token.type == expected_type:
            return self.consume()

        suggestion = "Revisa la sintaxis segun la gramatica."
        if expected_type == 'SEMICOLON':
            suggestion = "Falta un punto y coma ';' al final de la sentencia."
        elif expected_type == 'RPAREN':
            suggestion = "Falta un parentesis de cierre ')'."
        elif expected_type == 'EQUALS':
            suggestion = "Se esperaba '=' para completar la asignacion."

        msg = f"Se esperaba '{expected_type}' pero se encontro '{token.value}'"
        err = ParseError(msg, token)
        self.error(msg, token, suggestion)
        raise err

    def error(self, message: str, token: Token, suggestion: str = ""):
        err_data = {
            "type": "Sintactico",
            "message": message,
            "line": token.line,
            "column": token.column,
            "start_idx": token.start_idx,
            "end_idx": token.end_idx,
            "suggestion": suggestion or "Verifica la sintaxis de la gramatica."
        }
        self.errors.append(err_data)
        self.record_trace("error", err_data)

    def record_trace(self, action: str, data: Dict[str, Any]):
        self.trace.append({"action": action, **data})

    def parse(self) -> Tuple[ProgramNode, List[Dict[str, Any]], List[Dict[str, Any]]]:
        self.record_trace("enter_rule", {"rule": "Programa"})

        start_line = self.current_token.line
        start_col = self.current_token.column
        start_idx = self.current_token.start_idx

        statements = self.sentencias()

        try:
            self.match('EOF')
        except ParseError:
            pass

        root_id = self.next_node_id()
        root_node = ProgramNode(root_id, statements, start_line, start_col, start_idx, self.current_token.end_idx)

        self.record_trace("create_node", {
            "node_id": root_id,
            "label": "Programa",
            "type": "Program",
            "line": start_line,
            "col": start_col,
            "start_idx": start_idx,
            "end_idx": self.current_token.end_idx
        })

        for stmt in statements:
            self.record_trace("add_child", {"parent_id": root_id, "child_id": stmt.id})

        self.record_trace("exit_rule", {"rule": "Programa", "node_id": root_id})
        return root_node, self.errors, self.trace

    def sentencias(self) -> List[Node]:
        """Sentencias -> Sentencia Sentencias | e"""
        self.record_trace("enter_rule", {"rule": "Sentencias"})
        statements = []

        while self.current_token.type != 'EOF' and self.current_token.type != 'RPAREN':
            initial_pos = self.pos

            try:
                if self.current_token.type in ('ID', 'NUMERO', 'LPAREN'):
                    statements.append(self.sentencia())
                else:
                    msg = f"Sentencia no valida: token '{self.current_token.value}'"
                    self.error(msg, self.current_token, "Una sentencia debe comenzar con variable, numero o '('")
                    self.synchronize()
            except ParseError:
                self.synchronize()

            if self.pos == initial_pos:
                self.consume()

        self.record_trace("exit_rule", {"rule": "Sentencias"})
        return statements

    def sentencia(self) -> Node:
        """Sentencia -> Asignacion | Expresion ";" """
        self.record_trace("enter_rule", {"rule": "Sentencia"})

        # LL(2): ID seguido de '=' es asignacion
        if self.current_token.type == 'ID' and self.peek(1).type == 'EQUALS':
            node = self.asignacion()
        else:
            node = self.expresion()
            self.match('SEMICOLON')

        self.record_trace("exit_rule", {"rule": "Sentencia"})
        return node

    def asignacion(self) -> Node:
        """Asignacion -> ID "=" Expresion ";" """
        self.record_trace("enter_rule", {"rule": "Asignacion"})

        start_line = self.current_token.line
        start_col = self.current_token.column
        start_idx = self.current_token.start_idx

        id_token = self.match('ID')
        self.match('EQUALS')
        expr_node = self.expresion()
        self.match('SEMICOLON')

        node_id = self.next_node_id()
        node = AssignNode(node_id, id_token.value, expr_node, start_line, start_col, start_idx, self.current_token.end_idx)

        self.record_trace("create_node", {
            "node_id": node_id,
            "label": f"{id_token.value} =",
            "type": "Assign",
            "line": start_line,
            "col": start_col,
            "start_idx": start_idx,
            "end_idx": self.current_token.end_idx
        })

        var_sub_id = f"{node_id}_var"
        self.record_trace("create_node", {
            "node_id": var_sub_id,
            "label": id_token.value,
            "type": "Variable",
            "line": id_token.line,
            "col": id_token.column,
            "start_idx": id_token.start_idx,
            "end_idx": id_token.end_idx
        })

        self.record_trace("add_child", {"parent_id": node_id, "child_id": var_sub_id})
        self.record_trace("add_child", {"parent_id": node_id, "child_id": expr_node.id})

        self.record_trace("exit_rule", {"rule": "Asignacion", "node_id": node_id})
        return node

    def expresion(self) -> Node:
        """Expresion -> Termino Expresion'"""
        self.record_trace("enter_rule", {"rule": "Expresion"})
        node = self.termino()
        node = self.expresion_prime(node)
        self.record_trace("exit_rule", {"rule": "Expresion"})
        return node

    def expresion_prime(self, left_node: Node) -> Node:
        """Expresion' -> ("+" | "-") Termino Expresion' | e"""
        self.record_trace("enter_rule", {"rule": "Expresion'"})

        if self.current_token.type in ('PLUS', 'MINUS'):
            op_token = self.consume()
            right_node = self.termino()
            node_id = self.next_node_id()
            new_node = BinOpNode(
                node_id, op_token.value, left_node, right_node,
                left_node.line, left_node.col, left_node.start_idx, right_node.end_idx
            )

            self.record_trace("create_node", {
                "node_id": node_id,
                "label": op_token.value,
                "type": "BinOp",
                "line": op_token.line,
                "col": op_token.column,
                "start_idx": left_node.start_idx,
                "end_idx": right_node.end_idx
            })

            self.record_trace("add_child", {"parent_id": node_id, "child_id": left_node.id})
            self.record_trace("add_child", {"parent_id": node_id, "child_id": right_node.id})

            node = self.expresion_prime(new_node)
        else:
            node = left_node

        self.record_trace("exit_rule", {"rule": "Expresion'"})
        return node

    def termino(self) -> Node:
        """Termino -> Factor Termino'"""
        self.record_trace("enter_rule", {"rule": "Termino"})
        node = self.factor()
        node = self.termino_prime(node)
        self.record_trace("exit_rule", {"rule": "Termino"})
        return node

    def termino_prime(self, left_node: Node) -> Node:
        """Termino' -> ("*" | "/") Factor Termino' | e"""
        self.record_trace("enter_rule", {"rule": "Termino'"})

        if self.current_token.type in ('TIMES', 'DIVIDE'):
            op_token = self.consume()
            right_node = self.factor()
            node_id = self.next_node_id()
            new_node = BinOpNode(
                node_id, op_token.value, left_node, right_node,
                left_node.line, left_node.col, left_node.start_idx, right_node.end_idx
            )

            self.record_trace("create_node", {
                "node_id": node_id,
                "label": op_token.value,
                "type": "BinOp",
                "line": op_token.line,
                "col": op_token.column,
                "start_idx": left_node.start_idx,
                "end_idx": right_node.end_idx
            })

            self.record_trace("add_child", {"parent_id": node_id, "child_id": left_node.id})
            self.record_trace("add_child", {"parent_id": node_id, "child_id": right_node.id})

            node = self.termino_prime(new_node)
        else:
            node = left_node

        self.record_trace("exit_rule", {"rule": "Termino'"})
        return node

    def factor(self) -> Node:
        """Factor -> "(" Expresion ")" | ID | NUMERO"""
        self.record_trace("enter_rule", {"rule": "Factor"})

        token = self.current_token

        if token.type == 'LPAREN':
            self.match('LPAREN')
            node = self.expresion()
            self.match('RPAREN')

        elif token.type == 'ID':
            self.consume()
            node_id = self.next_node_id()
            node = VarNode(node_id, token.value, token.line, token.column, token.start_idx, token.end_idx)

            self.record_trace("create_node", {
                "node_id": node_id,
                "label": token.value,
                "type": "Variable",
                "line": token.line,
                "col": token.column,
                "start_idx": token.start_idx,
                "end_idx": token.end_idx
            })

        elif token.type == 'NUMERO':
            self.consume()
            node_id = self.next_node_id()
            val = float(token.value) if '.' in token.value else int(token.value)
            node = NumNode(node_id, val, token.line, token.column, token.start_idx, token.end_idx)

            self.record_trace("create_node", {
                "node_id": node_id,
                "label": str(val),
                "type": "Number",
                "line": token.line,
                "col": token.column,
                "start_idx": token.start_idx,
                "end_idx": token.end_idx
            })

        else:
            msg = f"Se esperaba numero, variable o '(' pero se encontro '{token.value}'"
            err = ParseError(msg, token)
            self.error(msg, token, "Revisa si falta un operando o hay un operador suelto.")
            raise err

        self.record_trace("exit_rule", {"rule": "Factor"})
        return node

    def synchronize(self):
        """Recuperacion de errores: avanza hasta ';' o EOF."""
        self.record_trace("synchronize", {"message": "Sincronizando parser..."})
        while self.current_token.type not in ('SEMICOLON', 'EOF'):
            self.consume()
        if self.current_token.type == 'SEMICOLON':
            self.consume()
