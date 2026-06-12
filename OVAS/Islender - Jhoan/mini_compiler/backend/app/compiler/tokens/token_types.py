from enum import Enum, auto

class TokenType(Enum):
    # Literales
    INTEGER    = auto()
    FLOAT      = auto()
    STRING     = auto()
    BOOLEAN    = auto()

    # Identificadores
    IDENTIFIER = auto()

    # Palabras clave
    INT        = auto()
    FLOAT_KW   = auto()
    STRING_KW  = auto()
    BOOL       = auto()
    IF         = auto()
    ELSE       = auto()
    WHILE      = auto()
    FOR        = auto()
    RETURN     = auto()
    FUNC       = auto()
    TRUE       = auto()
    FALSE      = auto()
    PRINT      = auto()
    VOID       = auto()

    # Operadores aritméticos
    PLUS       = auto()
    MINUS      = auto()
    STAR       = auto()
    SLASH      = auto()
    PERCENT    = auto()

    # Operadores relacionales
    EQ         = auto()   # ==
    NEQ        = auto()   # !=
    LT         = auto()   # <
    GT         = auto()   # >
    LTE        = auto()   # <=
    GTE        = auto()   # >=

    # Operadores lógicos
    AND        = auto()   # &&
    OR         = auto()   # ||
    NOT        = auto()   # !

    # Asignación
    ASSIGN     = auto()   # =

    # Delimitadores
    LPAREN     = auto()   # (
    RPAREN     = auto()   # )
    LBRACE     = auto()   # {
    RBRACE     = auto()   # }
    LBRACKET   = auto()   # [
    RBRACKET   = auto()   # ]
    SEMICOLON  = auto()   # ;
    COMMA      = auto()   # ,
    COLON      = auto()   # :

    # Especiales
    EOF        = auto()
    UNKNOWN    = auto()
