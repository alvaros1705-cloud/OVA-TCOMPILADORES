# 06. Preguntas frecuentes

## ¿El proyecto es un compilador real?

Es un compilador didáctico parcial. No compila hasta código máquina, pero sí simula fases importantes como tokenización, validación sintáctica básica, tabla de símbolos y análisis semántico.

---

## ¿Cuál es el objetivo principal?

Explicar de forma visual qué hace el análisis semántico dentro de un compilador.

---

## ¿Qué es un error semántico?

Es un error relacionado con el significado del código.

Ejemplo:

```txt
entero edad = 20;
texto nombre = "Gabriel";
edad = nombre;
```

La instrucción tiene forma de asignación, pero no tiene sentido porque `edad` es entero y `nombre` es texto.

---

## ¿Qué diferencia hay entre léxico, sintáctico y semántico?

| Fase | Qué revisa | Ejemplo |
|---|---|---|
| Léxico | Palabras o tokens | `entero`, `edad`, `20` |
| Sintáctico | Estructura | `tipo nombre = valor;` |
| Semántico | Significado | No asignar texto a entero |

---

## ¿Qué es la tabla de símbolos?

Es una estructura donde el compilador guarda información de variables e identificadores.

Ejemplo:

| Nombre | Tipo | Línea |
|---|---|---|
| edad | entero | 1 |
| nombre | texto | 2 |

---

## ¿Por qué el lenguaje se llama MiniLenguaje USB?

Porque es un lenguaje pequeño creado para fines académicos dentro del contexto de la Universidad Simón Bolívar.

---

## ¿Por qué se usa JavaScript?

Porque permite ejecutar la demo directamente en el navegador sin necesidad de backend ni base de datos.

---

## ¿Por qué se usa Nginx?

Porque la aplicación es estática. Nginx es liviano y suficiente para servir archivos HTML, CSS y JavaScript.

---

## ¿Por qué se usa Docker?

Porque Docker permite empaquetar la aplicación para que corra igual en local, en Dokploy o en otro servidor.

---

## ¿Por qué se usa Dokploy?

Porque permite desplegar el proyecto desde GitHub usando Docker Compose, sin configurar todo manualmente desde cero.

---

## ¿Por qué se usa Cosmos Cloud?

Porque funciona como reverse proxy y permite publicar la aplicación con un dominio, por ejemplo:

```txt
https://dominio-del-proyecto.example
```

---

## ¿Qué mejoras se podrían hacer?

- Agregar funciones.
- Agregar arreglos.
- Agregar más reglas semánticas.
- Exportar resultados a PDF.
- Agregar modo profesor con explicación paso a paso.

---

### ¿Por qué no se muestra un AST o árbol sintáctico?

Porque esta versión del proyecto no trabaja internamente con árboles. Para que la explicación sea coherente con lo implementado, la demo se enfoca en tokens, tabla de símbolos, validación sintáctica básica, validación semántica y código intermedio didáctico.
