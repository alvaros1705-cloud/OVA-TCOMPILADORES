# Analizador Sintactico EBNF - Proyecto Final de Teoria de Compiladores

Aplicacion web para analizar codigo de una gramatica LL(1)/LL(2). Permite ver la tokenizacion, el analisis sintactico, el analisis semantico y el arbol sintactico (AST) de forma interactiva.

---

## Caracteristicas

1. **Analizador lexico y sintactico**
   - Parser recursivo descendente segun la gramatica formal del curso.
   - Recuperacion de errores en modo panico (sincroniza en `;` o EOF).
   - Tokens con linea, columna y offsets.

2. **Analizador semantico**
   - Tabla de simbolos en tiempo real.
   - Inferencia de tipos (`Entero` o `Real`).
   - Evaluacion de constantes en tiempo de compilacion.
   - Historial de asignaciones por variable.
   - Deteccion de variables no definidas y division por cero.

3. **Modo paso a paso**
   - Muestra como el parser consume tokens y construye el AST.
   - Controles de velocidad, pausa, retroceso y avance.

4. **Visualizacion del AST (D3.js)**
   - Layouts: vertical, horizontal y radial.
   - Zoom, arrastre y nodos colapsables.
   - Resaltado entre el arbol y el editor al pasar el mouse.

5. **Codigo intermedio (TAC)**
   - Generacion de codigo de tres direcciones a partir del AST.

6. **Exportacion**
   - PNG del arbol AST.
   - Reporte PDF con codigo fuente, AST, simbolos, tokens y errores.

7. **Ejemplos e historial**
   - 10 ejemplos precargados (validos e invalidos).
   - Historial de los ultimos 5 codigos analizados (localStorage).

---

## Estructura de carpetas

```text
analizador-sintactico/
├── backend/
│   ├── main.py          # Servidor FastAPI
│   ├── lexer.py         # Analizador lexico
│   ├── parser.py        # Analizador sintactico
│   ├── ast_nodes.py     # Nodos del AST
│   ├── analyzer.py      # Analizador semantico
│   ├── tac_generator.py # Generador de TAC
│   ├── schemas.py       # Modelos Pydantic
│   └── test_compiler.py # Pruebas con pytest
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── ejemplos/
│   └── ejemplos.json
├── GUIA_USUARIO.pdf     # Guia de uso
└── README.md
```

---

## Gramatica LL(1) implementada

```ebnf
Programa   → Sentencias EOF
Sentencias → Sentencia Sentencias | ε
Sentencia  → Asignacion | Expresion ";"

Asignacion → ID "=" Expresion ";"

Expresion  → Termino Expresion'
Expresion' → ("+" | "-") Termino Expresion' | ε

Termino    → Factor Termino'
Termino'   → ("*" | "/") Factor Termino' | ε

Factor     → "(" Expresion ")" | ID | NUMERO
```

- **LL(1) en expresiones**: reglas factorizadas por la derecha para eliminar recursividad izquierda.
- **LL(2) en sentencias**: si el token es `ID` y el siguiente es `=`, es asignacion; si no, es expresion.

---

## Instalacion y ejecucion

### Requisitos
- Python 3.11 o superior
- Navegador web (Chrome, Firefox o Edge)

### Pasos

```bash
cd analizador-sintactico
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

Abrir en el navegador: **http://127.0.0.1:8001** (API + frontend embebido)

**Integración con Portal USB (desarrollo local):**

| Servicio | URL API |
|----------|---------|
| Analizador Sintáctico (esta OVA) | `http://localhost:8001` |
| Mini Compilador (Islender) | `http://localhost:8002` |

Endpoints: `GET /health`, `POST /api/analyze`, `GET /api/examples`

En Render.com el servicio usa la variable `$PORT` automáticamente (ver `render.yaml`).

---

## Tecnologias

- **Backend**: Python, FastAPI, Pydantic, Uvicorn
- **Frontend**: HTML, CSS, JavaScript
- **Editor**: Monaco Editor (CDN)
- **Graficos**: D3.js v7
- **PDF**: jsPDF, html2canvas
