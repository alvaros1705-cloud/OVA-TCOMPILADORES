# Manual tecnico del codigo

## Objetivo

Este documento explica como esta organizado el proyecto Compilador Semantico Web y que debe modificarse si se desea ampliar la herramienta.

## Archivos principales

- `index.html`: define la estructura de la pagina.
- `styles.css`: controla el diseno visual y el responsive.
- `analyzer.js`: contiene la logica del analizador.
- `Dockerfile`: define la imagen Nginx.
- `docker-compose.yml`: define como se ejecuta el contenedor.

## Flujo general

1. El usuario escribe codigo en el editor.
2. `analyzer.js` lee el contenido del `textarea`.
3. El codigo se divide en tokens.
4. Se valida la sintaxis basica.
5. Se construye la tabla de simbolos.
6. Se validan tipos y variables.
7. Se muestran errores, tokens, simbolos y codigo intermedio.

## Donde modificar

- Para agregar un nuevo tipo de dato: modificar `TYPE_KEYWORDS`, `suggestedTypeFor()` y `assignmentProblem()`.
- Para agregar nuevas instrucciones: modificar `analyze()`.
- Para cambiar mensajes de error: modificar `issue()`, `undeclaredIssue()` y las validaciones dentro de `analyze()`.
- Para cambiar la apariencia: modificar `styles.css`.
- Para cambiar la estructura visual: modificar `index.html`.

## Recomendacion

Si el proyecto crece, conviene separar el analizador en modulos o mover la logica a un backend.
