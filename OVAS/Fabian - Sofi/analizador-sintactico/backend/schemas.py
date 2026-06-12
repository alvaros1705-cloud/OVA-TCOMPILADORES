from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalyzeRequest(BaseModel):
    code: str

class TokenSchema(BaseModel):
    type: str
    category: str
    value: str
    line: int
    column: int
    start_idx: int
    end_idx: int

class ErrorSchema(BaseModel):
    type: str
    message: str
    line: int
    column: int
    start_idx: int
    end_idx: int
    suggestion: str

class SymbolSchema(BaseModel):
    name: str
    type: str
    value: str
    is_constant: bool
    line: int
    column: int
    history: List[Dict[str, Any]]

class AnalyzeResponse(BaseModel):
    tokens: List[TokenSchema]
    ast: Optional[Dict[str, Any]] = None
    symbols: List[SymbolSchema]
    errors: List[ErrorSchema]
    trace: List[Dict[str, Any]]
    tac: List[str]
