import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.schemas import AnalyzeRequest, AnalyzeResponse
from backend.lexer import Lexer
from backend.parser import Parser
from backend.analyzer import ASTAnalyzer
from backend.tac_generator import TACGenerator

app = FastAPI(
    title="Analizador Sintactico EBNF",
    description="API para analisis lexico, sintactico y semantico.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLES_PATH = os.path.join(BASE_DIR, "ejemplos", "ejemplos.json")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_code(request: AnalyzeRequest):
    code = request.code

    lexer = Lexer(code)
    tokens, lexical_errors = lexer.tokenize()

    parser = Parser(tokens)
    ast_root, syntactic_errors, trace = parser.parse()

    symbols = []
    semantic_errors = []
    if ast_root:
        analyzer = ASTAnalyzer()
        symbols, semantic_errors = analyzer.analyze(ast_root)

    all_errors = lexical_errors + syntactic_errors + semantic_errors

    tac_instructions = []
    if ast_root:
        tac_gen = TACGenerator()
        tac_instructions = tac_gen.generate(ast_root)

    serialized_tokens = [tok.to_dict() for tok in tokens]
    serialized_ast = ast_root.to_dict() if ast_root else None

    return {
        "tokens": serialized_tokens,
        "ast": serialized_ast,
        "symbols": symbols,
        "errors": all_errors,
        "trace": trace,
        "tac": tac_instructions
    }

@app.get("/api/examples")
def get_examples():
    if not os.path.exists(EXAMPLES_PATH):
        raise HTTPException(status_code=404, detail="Archivo de ejemplos no encontrado.")
    try:
        with open(EXAMPLES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo ejemplos: {str(e)}")

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
