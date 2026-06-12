from .token_types import TokenType

KEYWORDS: dict[str, TokenType] = {
    "int":    TokenType.INT,
    "float":  TokenType.FLOAT_KW,
    "string": TokenType.STRING_KW,
    "bool":   TokenType.BOOL,
    "if":     TokenType.IF,
    "else":   TokenType.ELSE,
    "while":  TokenType.WHILE,
    "for":    TokenType.FOR,
    "return": TokenType.RETURN,
    "func":   TokenType.FUNC,
    "true":   TokenType.TRUE,
    "false":  TokenType.FALSE,
    "print":  TokenType.PRINT,
    "void":   TokenType.VOID,
}
