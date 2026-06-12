import re
from typing import List, Dict, Any, Tuple

TOKEN_CATEGORIES = {
    "ID":        "Identificador",
    "NUMERO":    "Literal / Constante",
    "EQUALS":    "Operador",
    "PLUS":      "Operador",
    "MINUS":     "Operador",
    "TIMES":     "Operador",
    "DIVIDE":    "Operador",
    "LPAREN":    "Separador / Delimitador",
    "RPAREN":    "Separador / Delimitador",
    "SEMICOLON": "Separador / Delimitador",
    "EOF":       "Fin de Archivo",
    "ERROR":     "Error Lexico",
}

class Token:
    def __init__(self, type_: str, value: str, line: int, column: int, start_idx: int, end_idx: int):
        self.type = type_
        self.value = value
        self.line = line
        self.column = column
        self.start_idx = start_idx
        self.end_idx = end_idx
        self.category = TOKEN_CATEGORIES.get(type_, "Desconocido")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "category": self.category,
            "value": self.value,
            "line": self.line,
            "column": self.column,
            "start_idx": self.start_idx,
            "end_idx": self.end_idx
        }

    def __repr__(self):
        return f"Token({self.type}[{self.category}], '{self.value}', L:{self.line}, C:{self.column})"


class Lexer:
    def __init__(self, code: str):
        self.code = code
        self.pos = 0
        self.line = 1
        self.col = 1
        self.errors = []
        self.tokens = []

    def error(self, message: str, length: int = 1):
        self.errors.append({
            "type": "Lexico",
            "message": message,
            "line": self.line,
            "column": self.col,
            "start_idx": self.pos,
            "end_idx": self.pos + length,
            "suggestion": "Verifica que el caracter sea valido en la gramatica."
        })

    def peek(self) -> str:
        if self.pos >= len(self.code):
            return ""
        return self.code[self.pos]

    def advance(self) -> str:
        if self.pos >= len(self.code):
            return ""
        char = self.code[self.pos]
        self.pos += 1
        if char == '\n':
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return char

    def skip_whitespace(self):
        while True:
            char = self.peek()
            if char in (' ', '\t', '\r', '\n'):
                self.advance()
            else:
                break

    def read_number(self) -> Token:
        start_pos = self.pos
        start_col = self.col
        start_line = self.line

        value = ""
        while self.peek().isdigit():
            value += self.advance()

        if self.peek() == '.':
            self.pos += 1
            next_char = self.peek()
            self.pos -= 1

            if next_char.isdigit():
                value += self.advance()
                while self.peek().isdigit():
                    value += self.advance()

        return Token("NUMERO", value, start_line, start_col, start_pos, self.pos)

    def read_identifier(self) -> Token:
        start_pos = self.pos
        start_col = self.col
        start_line = self.line

        value = ""
        while self.peek().isalnum() or self.peek() == '_':
            value += self.advance()

        return Token("ID", value, start_line, start_col, start_pos, self.pos)

    def tokenize(self) -> Tuple[List[Token], List[Dict[str, Any]]]:
        while self.pos < len(self.code):
            self.skip_whitespace()
            if self.pos >= len(self.code):
                break

            char = self.peek()
            start_pos = self.pos
            start_col = self.col
            start_line = self.line

            if char.isdigit():
                self.tokens.append(self.read_number())
                continue

            if char.isalpha() or char == '_':
                self.tokens.append(self.read_identifier())
                continue

            if char == '=':
                self.advance()
                self.tokens.append(Token("EQUALS", "=", start_line, start_col, start_pos, self.pos))
                continue
            if char == '+':
                self.advance()
                self.tokens.append(Token("PLUS", "+", start_line, start_col, start_pos, self.pos))
                continue
            if char == '-':
                self.advance()
                self.tokens.append(Token("MINUS", "-", start_line, start_col, start_pos, self.pos))
                continue
            if char == '*':
                self.advance()
                self.tokens.append(Token("TIMES", "*", start_line, start_col, start_pos, self.pos))
                continue
            if char == '/':
                self.advance()
                self.tokens.append(Token("DIVIDE", "/", start_line, start_col, start_pos, self.pos))
                continue
            if char == '(':
                self.advance()
                self.tokens.append(Token("LPAREN", "(", start_line, start_col, start_pos, self.pos))
                continue
            if char == ')':
                self.advance()
                self.tokens.append(Token("RPAREN", ")", start_line, start_col, start_pos, self.pos))
                continue
            if char == ';':
                self.advance()
                self.tokens.append(Token("SEMICOLON", ";", start_line, start_col, start_pos, self.pos))
                continue

            err_char = self.advance()
            self.error(f"Caracter ilegal '{err_char}'", length=1)
            self.tokens.append(Token("ERROR", err_char, start_line, start_col, start_pos, self.pos))

        eof_pos = len(self.code)
        self.tokens.append(Token("EOF", "EOF", self.line, self.col, eof_pos, eof_pos))

        return self.tokens, self.errors
