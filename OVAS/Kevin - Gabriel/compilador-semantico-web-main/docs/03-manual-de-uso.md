# 03. Manual de uso de la aplicación

Este documento explica cómo usar la página web durante la exposición.

---

## 1. Abrir la aplicación

Puedes abrirla localmente:

```txt
http://localhost:8097
```

O desde el dominio publicado:

```txt
https://dominio-del-proyecto.example
```

---

## 2. Sección Inicio

La primera parte presenta el proyecto como un **compilador semántico interactivo**.

Aquí puedes explicar:

> Este proyecto permite visualizar cómo un compilador revisa si un programa está bien escrito en su estructura y si además tiene sentido.

---

## 3. Sección Teoría

Esta sección explica tres tareas importantes del análisis semántico:

1. Revisar declaraciones.
2. Validar tipos.
3. Construir tabla de símbolos.

Puedes usar esta analogía:

> Si el análisis léxico revisa las palabras y el sintáctico revisa la estructura de la oración, el semántico revisa si la oración tiene sentido.

---

## 4. Sección MiniLenguaje USB

El proyecto usa un lenguaje pequeño para facilitar la explicación.

Tipos disponibles:

```txt
entero
decimal
texto
logico
```

Instrucciones disponibles:

```txt
entero edad = 20;
edad = edad + 1;
imprimir(edad);
```

---

## 5. Sección Demo

Esta es la parte principal para mostrar en clase.

Tiene un editor y varios botones:

| Botón | Función |
|---|---|
| Cargar ejemplo correcto | Carga un programa sin errores. |
| Cargar ejemplo con errores | Carga un programa con errores de sintaxis y semántica. |
| Cargar condicional | Carga un ejemplo con estructura `si`. |
| Analizar código | Ejecuta el análisis. |
| Limpiar | Borra el contenido del editor. |

---

## 6. Pestaña Errores

Muestra los errores encontrados. Cada error indica si es de **Sintaxis** o de **Semántica**, la línea donde ocurrió y una ayuda para corregirlo.

Ejemplos de errores:

- Falta de `;` al final de una instrucción.
- Falta de `=` en una asignación.
- Falta de paréntesis en `imprimir(...)` o en `si (...)`.
- Variable no declarada o mal escrita.
- Variable declarada dos veces.
- Tipo incompatible en asignación.
- Condición no lógica.

Ejemplo para explicar:

```txt
entero edad = 20;
texto nombre = "Gabriel";
edad = nombre;
```

Explicación:

> Aquí `edad` es de tipo entero, pero se intenta guardar un texto. El programa está escrito con una forma válida, pero no tiene sentido semántico.

---

## 7. Pestaña Tabla de símbolos

Muestra la información de las variables reconocidas.

La tabla normalmente incluye:

- Nombre del identificador.
- Tipo de dato.
- Línea donde fue declarado.
- Valor inicial.
- Ámbito.

Puedes decir:

> La tabla de símbolos es como una lista de contactos del compilador. Allí guarda qué variables existen, de qué tipo son y dónde fueron declaradas.

---

## 8. Pestaña Tokens

Muestra los elementos básicos del programa.

Ejemplo:

```txt
entero edad = 20;
```

Puede dividirse en:

| Token | Tipo |
|---|---|
| `entero` | Palabra reservada |
| `edad` | Identificador |
| `=` | Operador |
| `20` | Número |
| `;` | Símbolo |

---

## 9. Pestaña Código intermedio

Muestra una representación didáctica de instrucciones generadas después del análisis.

No es código máquina real, sino una forma intermedia para explicar que el compilador transforma poco a poco el código fuente.

Puedes decir:

> Después de validar que el programa tiene sentido, el compilador puede preparar una representación más sencilla para continuar con otras fases.

---

## 10. Pestaña Explicación

Resume los pasos que siguió el analizador.

Sirve para mostrar que el análisis no ocurre de una sola vez, sino por etapas.

---

## 11. Recomendación para la exposición

Orden sugerido:

1. Mostrar Inicio.
2. Explicar la teoría.
3. Mostrar MiniLenguaje USB.
4. Ejecutar el ejemplo correcto.
5. Mostrar tabla de símbolos y tokens.
6. Ejecutar ejemplo con errores.
7. Explicar cuáles errores son de sintaxis y cuáles son semánticos.
8. Cerrar con el despliegue en Dokploy y Cosmos.


---

## 12. Casos rápidos para demostrar

Puedes pegar estos ejemplos en el editor durante la exposición:

```txt
decimal promedio 4.5;
```

Este caso muestra un error de sintaxis porque falta `=`.

```txt
entero edad = 20;
texto nombre = "Gabriel";
edad = nombre;
```

Este caso muestra un error semántico porque `edad` es entero y `nombre` es texto.

```txt
entero edad = 20;
eda = 30;
```

Este caso muestra una variable mal escrita. El sistema puede sugerir `edad`.
