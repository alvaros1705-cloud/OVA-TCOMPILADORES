import pytest
from backend.lexer import Lexer
from backend.parser import Parser
from backend.analyzer import ASTAnalyzer

def test_lexer_valid():
    code = "x = 3.14 + y * (10 - 2);"
    lexer = Lexer(code)
    tokens, errors = lexer.tokenize()

    assert len(errors) == 0
    token_types = [t.type for t in tokens]
    assert token_types == [
        'ID', 'EQUALS', 'NUMERO', 'PLUS', 'ID', 'TIMES',
        'LPAREN', 'NUMERO', 'MINUS', 'NUMERO', 'RPAREN', 'SEMICOLON', 'EOF'
    ]

def test_lexer_errors():
    code = "a = 5 $ 10;"
    lexer = Lexer(code)
    _, errors = lexer.tokenize()

    assert len(errors) == 1
    assert errors[0]["type"] == "Lexico"
    assert "Caracter ilegal '$'" in errors[0]["message"]

def test_parser_valid():
    code = "x = 10; y = x + 5;"
    lexer = Lexer(code)
    tokens, _ = lexer.tokenize()

    parser = Parser(tokens)
    ast, errors, _ = parser.parse()

    assert len(errors) == 0
    assert ast is not None
    assert ast.type == "Program"
    assert len(ast.statements) == 2
    assert ast.statements[0].type == "Assign"
    assert ast.statements[0].var_name == "x"

def test_parser_syntax_errors():
    code = "x = 5 + ; y = 10"
    lexer = Lexer(code)
    tokens, _ = lexer.tokenize()

    parser = Parser(tokens)
    _, errors, _ = parser.parse()

    assert len(errors) >= 2
    assert any("SEMICOLON" in err["message"] or "punto y coma" in err["suggestion"] for err in errors)

def test_semantic_analyzer():
    code = "x = 10; pi = 3.14; area = pi * x * x;"
    lexer = Lexer(code)
    tokens, _ = lexer.tokenize()

    parser = Parser(tokens)
    ast, _, _ = parser.parse()

    analyzer = ASTAnalyzer()
    symbols, errors = analyzer.analyze(ast)

    assert len(errors) == 0
    assert len(symbols) == 3

    x_symbol = next(s for s in symbols if s["name"] == "x")
    assert x_symbol["type"] == "Entero"
    assert x_symbol["value"] == "10"

    pi_symbol = next(s for s in symbols if s["name"] == "pi")
    assert pi_symbol["type"] == "Real"
    assert pi_symbol["value"] == "3.14"

    area_symbol = next(s for s in symbols if s["name"] == "area")
    assert area_symbol["type"] == "Real"
    assert float(area_symbol["value"]) == 314.0

def test_semantic_errors():
    code = "x = y + 1; z = 10 / (5 - 5);"
    lexer = Lexer(code)
    tokens, _ = lexer.tokenize()

    parser = Parser(tokens)
    ast, _, _ = parser.parse()

    analyzer = ASTAnalyzer()
    _, errors = analyzer.analyze(ast)

    assert len(errors) == 2
    assert any("Variable 'y' no definida" in err["message"] for err in errors)
    assert any("Division por cero" in err["message"] for err in errors)
