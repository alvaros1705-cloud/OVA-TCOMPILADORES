from pydantic import BaseModel

class CompileRequest(BaseModel):
    source: str

class TokenOut(BaseModel):
    type: str
    value: str
    line: int
    column: int

class QuadrupleOut(BaseModel):
    op: str
    arg1: str | None
    arg2: str | None
    result: str

class CompileResponse(BaseModel):
    success: bool
    tokens: list[TokenOut]
    quadruples: list[QuadrupleOut]
    symbol_table: dict | None
    errors: list[str]
    warnings: list[str]
