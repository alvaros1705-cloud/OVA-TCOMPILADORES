from typing import List
from ..tokens import Token, TokenType, Position, KEYWORDS, ONE_CHAR_OPS, TWO_CHAR_OPS, DELIMITERS
from ..errors.lexical_error import LexicalError

class Lexer:
    """Analizador léxico para MiniCompilador."""

    def __init__(self, source: str):
        self.source = source
        self.pos = 0
        self.line = 1
        self.column = 1
        self.tokens: List[Token] = []
        self.errors: List[LexicalError] = []

    def tokenize(self) -> List[Token]:
        while not self._at_end():
            self._skip_whitespace_and_comments()
            if self._at_end():
                break
            try:
                tok = self._next_token()
                if tok:
                    self.tokens.append(tok)
            except LexicalError as e:
                self.errors.append(e)
                self._advance()  # recuperación: saltar caracter inválido

        self.tokens.append(Token(TokenType.EOF, "", self._position()))
        return self.tokens

    # ── helpers de posición ──────────────────────────────────────────────
    def _position(self) -> Position:
        return Position(self.line, self.column, self.pos)

    def _current(self) -> str:
        return self.source[self.pos] if self.pos < len(self.source) else "\0"

    def _peek_next(self) -> str:
        return self.source[self.pos + 1] if self.pos + 1 < len(self.source) else "\0"

    def _at_end(self) -> bool:
        return self.pos >= len(self.source)

    def _advance(self) -> str:
        ch = self.source[self.pos]
        self.pos += 1
        if ch == "\n":
            self.line += 1
            self.column = 1
        else:
            self.column += 1
        return ch

    # ── salto de espacios y comentarios ─────────────────────────────────
    def _skip_whitespace_and_comments(self):
        while not self._at_end():
            ch = self._current()
            if ch in " \t\r\n":
                self._advance()
            elif ch == "/" and self._peek_next() == "/":
                # comentario de línea
                while not self._at_end() and self._current() != "\n":
                    self._advance()
            elif ch == "/" and self._peek_next() == "*":
                # comentario de bloque
                self._advance(); self._advance()
                while not self._at_end():
                    if self._current() == "*" and self._peek_next() == "/":
                        self._advance(); self._advance()
                        break
                    self._advance()
            else:
                break

    # ── reconocimiento de tokens ─────────────────────────────────────────
    def _next_token(self) -> Token:
        pos = self._position()
        ch = self._current()

        # Número
        if ch.isdigit():
            return self._read_number(pos)

        # String
        if ch == '"':
            return self._read_string(pos)

        # Identificador o keyword
        if ch.isalpha() or ch == "_":
            return self._read_identifier(pos)

        # Operador de dos caracteres
        two = ch + self._peek_next()
        if two in TWO_CHAR_OPS:
            self._advance(); self._advance()
            return Token(TWO_CHAR_OPS[two], two, pos)

        # Operador de un caracter
        if ch in ONE_CHAR_OPS:
            self._advance()
            return Token(ONE_CHAR_OPS[ch], ch, pos)

        # Delimitador
        if ch in DELIMITERS:
            self._advance()
            return Token(DELIMITERS[ch], ch, pos)

        # Caracter desconocido
        self._advance()
        raise LexicalError(f"Carácter no reconocido: '{ch}'", pos)

    def _read_number(self, pos: Position) -> Token:
        start = self.pos
        is_float = False
        while not self._at_end() and self._current().isdigit():
            self._advance()
        if not self._at_end() and self._current() == "." and self._peek_next().isdigit():
            is_float = True
            self._advance()
            while not self._at_end() and self._current().isdigit():
                self._advance()
        value = self.source[start:self.pos]
        ttype = TokenType.FLOAT if is_float else TokenType.INTEGER
        return Token(ttype, value, pos)

    def _read_string(self, pos: Position) -> Token:
        self._advance()  # saltar "
        start = self.pos
        while not self._at_end() and self._current() != '"':
            if self._current() == "\n":
                raise LexicalError("String sin cerrar", pos)
            self._advance()
        if self._at_end():
            raise LexicalError("String sin cerrar al final del archivo", pos)
        value = self.source[start:self.pos]
        self._advance()  # saltar "
        return Token(TokenType.STRING, value, pos)

    def _read_identifier(self, pos: Position) -> Token:
        start = self.pos
        while not self._at_end() and (self._current().isalnum() or self._current() == "_"):
            self._advance()
        value = self.source[start:self.pos]
        ttype = KEYWORDS.get(value, TokenType.IDENTIFIER)
        # booleanos como literales
        if ttype in (TokenType.TRUE, TokenType.FALSE):
            return Token(TokenType.BOOLEAN, value, pos)
        return Token(ttype, value, pos)
