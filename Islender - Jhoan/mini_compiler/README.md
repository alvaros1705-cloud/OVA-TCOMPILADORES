# MiniCompilador

Compilador completo para el lenguaje **MiniC** (.mc), implementado en Python.

## Fases implementadas

1. **Análisis Léxico** — Tokenización con manejo de errores
2. **Análisis Sintáctico** — Parser recursivo descendente
3. **Análisis Semántico** — Verificación de tipos y scopes
4. **Generación de Código Intermedio** — Cuádruplas (TAC)

## Lenguaje MiniC

```
// Variables
int x = 10;
float pi = 3.14;
string msg = "hola";
bool flag = true;

// Funciones
func suma(int a, int b) : int {
    return a + b;
}

// Control
if (x > 5) { print(x); } else { print(0); }
while (x > 0) { x = x - 1; }

// Salida
print("resultado");
```

## Ejecución

```bash
# Backend (puerto local 8002 — evita conflicto con analizador sintáctico en 8001)
cd backend && uvicorn main:app --reload --host 127.0.0.1 --port 8002

# Frontend estático (portal USB o directo)
# Abrir frontend/index.html vía servidor del portal en http://localhost:8080
```

**Integración con Portal USB (desarrollo local):**

| Servicio | URL API |
|----------|---------|
| Analizador Sintáctico (Fabian) | `http://localhost:8001` |
| Mini Compilador (esta OVA) | `http://localhost:8002` |

Endpoints: `GET /health`, `POST /api/compile`

En Render.com el servicio usa la variable `$PORT` automáticamente (ver `render.yaml`).

## Estructura
- `backend/app/compiler/` — Motor del compilador
- `frontend/` — Interfaz web
- `examples/` — Programas de ejemplo .mc
