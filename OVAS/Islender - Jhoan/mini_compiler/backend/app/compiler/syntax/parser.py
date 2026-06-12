"""Parser recursivo descendente para MiniCompilador."""
from typing import List, Optional
from ..tokens import TokenStream, TokenType
from ..ast import *
from ..errors.syntax_error import SyntaxError as MCSyntaxError

class Parser:
    def __init__(self, stream: TokenStream):
        self.s = stream
        self.errors: List[MCSyntaxError] = []

    def parse(self) -> ProgramNode:
        stmts = []
        while not self.s.is_at_end():
            stmt = self._declaration()
            if stmt:
                stmts.append(stmt)
        return ProgramNode(stmts)

    # ── declaraciones de alto nivel ──────────────────────────────────────
    def _declaration(self):
        try:
            if self.s.check(TokenType.FUNC):
                return self._function_decl()
            return self._statement()
        except MCSyntaxError as e:
            self.errors.append(e)
            self._synchronize()
            return None

    def _function_decl(self) -> FunctionDecl:
        pos = self.s.current_position
        self.s.expect(TokenType.FUNC)
        name = self.s.expect(TokenType.IDENTIFIER).value
        self.s.expect(TokenType.LPAREN)
        params = self._param_list()
        self.s.expect(TokenType.RPAREN)
        # tipo de retorno opcional: -> tipo
        ret_type = "void"
        if self.s.check(TokenType.COLON):
            self.s.advance()
            ret_type = self._type_name()
        self.s.expect(TokenType.LBRACE)
        body = self._block_body()
        self.s.expect(TokenType.RBRACE)
        return FunctionDecl(name, ret_type, params, body, position=pos)

    def _param_list(self) -> List[Parameter]:
        params = []
        if self.s.check(TokenType.RPAREN):
            return params
        params.append(self._param())
        while self.s.check(TokenType.COMMA):
            self.s.advance()
            params.append(self._param())
        return params

    def _param(self) -> Parameter:
        ptype = self._type_name()
        name = self.s.expect(TokenType.IDENTIFIER).value
        return Parameter(ptype, name)

    def _type_name(self) -> str:
        type_tokens = {TokenType.INT, TokenType.FLOAT_KW, TokenType.STRING_KW,
                       TokenType.BOOL, TokenType.VOID}
        tok = self.s.peek()
        if tok.type in type_tokens:
            self.s.advance()
            return tok.value
        raise MCSyntaxError(f"Se esperaba un tipo, se encontró '{tok.value}'", tok.position)

    # ── sentencias ────────────────────────────────────────────────────────
    def _statement(self):
        tok = self.s.peek()

        if tok.type in {TokenType.INT, TokenType.FLOAT_KW, TokenType.STRING_KW, TokenType.BOOL}:
            return self._var_declaration()
        if tok.type == TokenType.IF:
            return self._if_statement()
        if tok.type == TokenType.WHILE:
            return self._while_statement()
        if tok.type == TokenType.FOR:
            return self._for_statement()
        if tok.type == TokenType.RETURN:
            return self._return_statement()
        if tok.type == TokenType.PRINT:
            return self._print_statement()
        if tok.type == TokenType.LBRACE:
            return self._block()

        return self._expr_statement()

    def _var_declaration(self) -> VarDeclaration:
        pos = self.s.current_position
        vtype = self._type_name()
        name = self.s.expect(TokenType.IDENTIFIER).value
        init = None
        if self.s.check(TokenType.ASSIGN):
            self.s.advance()
            init = self._expression()
        self.s.expect(TokenType.SEMICOLON)
        return VarDeclaration(vtype, name, init, position=pos)

    def _if_statement(self) -> IfStatement:
        pos = self.s.current_position
        self.s.expect(TokenType.IF)
        self.s.expect(TokenType.LPAREN)
        cond = self._expression()
        self.s.expect(TokenType.RPAREN)
        self.s.expect(TokenType.LBRACE)
        then_b = self._block_body()
        self.s.expect(TokenType.RBRACE)
        else_b = None
        if self.s.check(TokenType.ELSE):
            self.s.advance()
            self.s.expect(TokenType.LBRACE)
            else_b = self._block_body()
            self.s.expect(TokenType.RBRACE)
        return IfStatement(cond, then_b, else_b, position=pos)

    def _while_statement(self) -> WhileStatement:
        pos = self.s.current_position
        self.s.expect(TokenType.WHILE)
        self.s.expect(TokenType.LPAREN)
        cond = self._expression()
        self.s.expect(TokenType.RPAREN)
        self.s.expect(TokenType.LBRACE)
        body = self._block_body()
        self.s.expect(TokenType.RBRACE)
        return WhileStatement(cond, body, position=pos)

    def _for_statement(self) -> ForStatement:
        pos = self.s.current_position
        self.s.expect(TokenType.FOR)
        self.s.expect(TokenType.LPAREN)
        # init
        init = None
        if not self.s.check(TokenType.SEMICOLON):
            if self.s.peek().type in {TokenType.INT, TokenType.FLOAT_KW, TokenType.STRING_KW, TokenType.BOOL}:
                vtype = self._type_name()
                name = self.s.expect(TokenType.IDENTIFIER).value
                self.s.expect(TokenType.ASSIGN)
                val = self._expression()
                init = VarDeclaration(vtype, name, val, position=pos)
            else:
                init = self._expression()
        self.s.expect(TokenType.SEMICOLON)
        cond = None if self.s.check(TokenType.SEMICOLON) else self._expression()
        self.s.expect(TokenType.SEMICOLON)
        update = None if self.s.check(TokenType.RPAREN) else self._expression()
        self.s.expect(TokenType.RPAREN)
        self.s.expect(TokenType.LBRACE)
        body = self._block_body()
        self.s.expect(TokenType.RBRACE)
        return ForStatement(init, cond, update, body, position=pos)

    def _return_statement(self) -> ReturnStatement:
        pos = self.s.current_position
        self.s.expect(TokenType.RETURN)
        val = None
        if not self.s.check(TokenType.SEMICOLON):
            val = self._expression()
        self.s.expect(TokenType.SEMICOLON)
        return ReturnStatement(val, position=pos)

    def _print_statement(self) -> PrintStatement:
        pos = self.s.current_position
        self.s.expect(TokenType.PRINT)
        self.s.expect(TokenType.LPAREN)
        val = self._expression()
        self.s.expect(TokenType.RPAREN)
        self.s.expect(TokenType.SEMICOLON)
        return PrintStatement(val, position=pos)

    def _block(self) -> Block:
        pos = self.s.current_position
        self.s.expect(TokenType.LBRACE)
        stmts = self._block_body()
        self.s.expect(TokenType.RBRACE)
        return Block(stmts, position=pos)

    def _block_body(self) -> List:
        stmts = []
        while not self.s.check(TokenType.RBRACE) and not self.s.is_at_end():
            s = self._declaration()
            if s:
                stmts.append(s)
        return stmts

    def _expr_statement(self) -> ExprStatement:
        pos = self.s.current_position
        expr = self._expression()
        self.s.expect(TokenType.SEMICOLON)
        return ExprStatement(expr, position=pos)

    # ── expresiones (precedencia ascendente) ─────────────────────────────
    def _expression(self):
        # Asignación: id = expr
        if (self.s.peek().type == TokenType.IDENTIFIER
                and self.s.peek(1).type == TokenType.ASSIGN):
            pos = self.s.current_position
            name = self.s.advance().value
            self.s.advance()  # =
            val = self._expression()
            return AssignmentExpr(name, val, position=pos)
        return self._or_expr()

    def _or_expr(self):
        left = self._and_expr()
        while self.s.check(TokenType.OR):
            op = self.s.advance().value
            right = self._and_expr()
            left = BinaryOp(op, left, right)
        return left

    def _and_expr(self):
        left = self._equality()
        while self.s.check(TokenType.AND):
            op = self.s.advance().value
            right = self._equality()
            left = BinaryOp(op, left, right)
        return left

    def _equality(self):
        left = self._relational()
        while self.s.check(TokenType.EQ, TokenType.NEQ):
            op = self.s.advance().value
            right = self._relational()
            left = BinaryOp(op, left, right)
        return left

    def _relational(self):
        left = self._additive()
        while self.s.check(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE):
            op = self.s.advance().value
            right = self._additive()
            left = BinaryOp(op, left, right)
        return left

    def _additive(self):
        left = self._multiplicative()
        while self.s.check(TokenType.PLUS, TokenType.MINUS):
            op = self.s.advance().value
            right = self._multiplicative()
            left = BinaryOp(op, left, right)
        return left

    def _multiplicative(self):
        left = self._unary()
        while self.s.check(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT):
            op = self.s.advance().value
            right = self._unary()
            left = BinaryOp(op, left, right)
        return left

    def _unary(self):
        if self.s.check(TokenType.NOT, TokenType.MINUS):
            pos = self.s.current_position
            op = self.s.advance().value
            return UnaryOp(op, self._unary(), position=pos)
        return self._primary()

    def _primary(self):
        tok = self.s.peek()
        pos = tok.position

        if tok.type == TokenType.INTEGER:
            self.s.advance()
            return IntegerLiteral(int(tok.value), position=pos)
        if tok.type == TokenType.FLOAT:
            self.s.advance()
            return FloatLiteral(float(tok.value), position=pos)
        if tok.type == TokenType.STRING:
            self.s.advance()
            return StringLiteral(tok.value, position=pos)
        if tok.type == TokenType.BOOLEAN:
            self.s.advance()
            return BooleanLiteral(tok.value == "true", position=pos)
        if tok.type == TokenType.IDENTIFIER:
            self.s.advance()
            # llamada a función
            if self.s.check(TokenType.LPAREN):
                self.s.advance()
                args = []
                if not self.s.check(TokenType.RPAREN):
                    args.append(self._expression())
                    while self.s.check(TokenType.COMMA):
                        self.s.advance()
                        args.append(self._expression())
                self.s.expect(TokenType.RPAREN)
                return FunctionCall(tok.value, args, position=pos)
            return IdentifierNode(tok.value, position=pos)
        if tok.type == TokenType.LPAREN:
            self.s.advance()
            expr = self._expression()
            self.s.expect(TokenType.RPAREN)
            return expr

        raise MCSyntaxError(f"Expresión inesperada: '{tok.value}'", pos)

    # ── recuperación de errores ───────────────────────────────────────────
    def _synchronize(self):
        sync_tokens = {TokenType.FUNC, TokenType.INT, TokenType.FLOAT_KW,
                       TokenType.STRING_KW, TokenType.BOOL, TokenType.IF,
                       TokenType.WHILE, TokenType.FOR, TokenType.RETURN,
                       TokenType.PRINT}
        while not self.s.is_at_end():
            if self.s.peek().type in sync_tokens:
                return
            self.s.advance()
