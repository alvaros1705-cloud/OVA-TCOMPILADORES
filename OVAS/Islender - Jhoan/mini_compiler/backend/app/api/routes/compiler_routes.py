from fastapi import APIRouter
from ..schemas.compiler_schema import CompileRequest, CompileResponse, TokenOut, QuadrupleOut
from ...compiler import CompilerPipeline

router = APIRouter()
pipeline = CompilerPipeline()

@router.post("/compile", response_model=CompileResponse)
def compile_source(request: CompileRequest):
    result = pipeline.compile(request.source)
    tokens_out = [
        TokenOut(type=t.type.name, value=t.value,
                 line=t.position.line, column=t.position.column)
        for t in result.tokens
    ]
    quads_out = [
        QuadrupleOut(op=q.op, arg1=q.arg1, arg2=q.arg2, result=q.result)
        for q in result.quadruples
    ]
    return CompileResponse(
        success=result.success,
        tokens=tokens_out,
        quadruples=quads_out,
        symbol_table=result.symbol_table,
        errors=result.errors,
        warnings=result.warnings,
    )
