"""Pipeline completo del compilador MiniC."""
from dataclasses import dataclass, field
from typing import List, Optional
from .lexical.lexer import Lexer
from .tokens import Token, TokenStream
from .syntax.parser import Parser
from .ast import ProgramNode
from .semantic.semantic_analyzer import SemanticAnalyzer
from .intermediate.tac_generator import TACGenerator
from .intermediate.ir_nodes import Quadruple
from .errors.compiler_error import CompilerError

@dataclass
class CompileResult:
    success: bool
    tokens: List[Token] = field(default_factory=list)
    ast: Optional[ProgramNode] = None
    symbol_table: Optional[dict] = None
    quadruples: List[Quadruple] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

class CompilerPipeline:
    def compile(self, source: str) -> CompileResult:
        result = CompileResult(success=False)

        # Fase 1: Análisis léxico
        lexer = Lexer(source)
        tokens = lexer.tokenize()
        result.tokens = tokens
        if lexer.errors:
            result.errors += [f"[Léxico] {e}" for e in lexer.errors]
            return result

        # Fase 2: Análisis sintáctico
        stream = TokenStream(tokens)
        parser = Parser(stream)
        ast = parser.parse()
        result.ast = ast
        if parser.errors:
            result.errors += [f"[Sintáctico] {e}" for e in parser.errors]
            return result

        # Fase 3: Análisis semántico
        analyzer = SemanticAnalyzer()
        analyzer.analyze(ast)
        result.symbol_table = analyzer.table.to_dict()
        if analyzer.errors:
            result.errors += [f"[Semántico] {e}" for e in analyzer.errors]
            return result

        # Fase 4: Generación de código intermedio
        tac = TACGenerator()
        quads = tac.generate(ast)
        result.quadruples = quads
        result.success = True
        return result
