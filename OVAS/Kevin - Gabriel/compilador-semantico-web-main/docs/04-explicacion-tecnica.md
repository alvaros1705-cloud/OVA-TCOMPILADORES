# 04. Explicación técnica del analizador semántico

Este documento explica cómo funciona internamente el proyecto.

---

## 1. Objetivo técnico

El objetivo del proyecto es simular una parte del proceso de compilación, principalmente la fase de **análisis semántico**. Además, incluye una validación sintáctica básica para que la demostración sea más clara.

La validación sintáctica revisa errores de forma, como falta de `;`, `=` o paréntesis. El análisis semántico revisa que las instrucciones del programa sean coherentes de acuerdo con las reglas del lenguaje.

---

## 2. Archivos principales

| Archivo | Función |
|---|---|
| `index.html` | Estructura de la interfaz web. |
| `styles.css` | Diseño visual de la aplicación. |
| `analyzer.js` | Lógica del analizador. |
| `Dockerfile` | Imagen Docker basada en Nginx. |
| `docker-compose.yml` | Configuración para levantar el servicio. |

---

## 3. Fases simuladas

La aplicación simula varias fases del proceso de compilación.

```txt
Código fuente → Tokens → Tabla de símbolos → Validación semántica → Código intermedio
```

---

## 4. Análisis léxico básico

Aunque el proyecto se centra en semántica, primero realiza una separación básica de tokens.

Ejemplo:

```txt
entero edad = 20;
```

Tokens detectados:

| Elemento | Clasificación |
|---|---|
| `entero` | Palabra reservada |
| `edad` | Identificador |
| `=` | Operador |
| `20` | Número |
| `;` | Símbolo |

---

## 5. Tabla de símbolos

La tabla de símbolos guarda información de las variables declaradas.

Ejemplo:

```txt
entero edad = 20;
texto nombre = "Gabriel";
```

Tabla conceptual:

| Nombre | Tipo | Valor | Línea | Ámbito |
|---|---|---|---|---|
| edad | entero | 20 | 1 | global |
| nombre | texto | Gabriel | 2 | global |

Esta tabla permite que el analizador responda preguntas como:

- ¿La variable existe?
- ¿Qué tipo de dato tiene?
- ¿Ya fue declarada antes?
- ¿Se puede usar en esta operación?

---

## 6. Reglas semánticas implementadas

### Regla 1: una variable debe declararse antes de usarse

Código con error:

```txt
promedio = 4.5;
```

Error:

```txt
La variable promedio no ha sido declarada.
```

---

### Regla 2: una variable no debe declararse dos veces en el mismo ámbito

Código con error:

```txt
texto nombre = "Gabriel";
texto nombre = "Kevin";
```

Error:

```txt
La variable nombre ya fue declarada.
```

---

### Regla 3: el tipo asignado debe ser compatible

Código con error:

```txt
entero edad = 20;
texto nombre = "Gabriel";
edad = nombre;
```

Error:

```txt
No se puede asignar texto a una variable de tipo entero.
```

---

### Regla 4: las condiciones deben ser lógicas

Código con error:

```txt
entero edad = 19;

si (edad) {
  imprimir(edad);
}
```

Error:

```txt
La condición del si debe ser de tipo logico.
```

La forma correcta sería:

```txt
si (edad >= 18) {
  imprimir(edad);
}
```

---

## 7. Inferencia de tipos

El analizador intenta deducir el tipo de las expresiones.

Ejemplos:

| Expresión | Tipo deducido |
|---|---|
| `20` | entero |
| `4.5` | decimal |
| `"Hola"` | texto |
| `verdadero` | logico |
| `edad + 1` | entero o decimal |
| `edad >= 18` | logico |

---

## 8. Código intermedio didáctico

El código intermedio mostrado en la app es una representación sencilla para explicar que el compilador transforma el programa en pasos más manejables.

Ejemplo:

```txt
entero edad = 20;
edad = edad + 1;
imprimir(edad);
```

Representación conceptual:

```txt
DECLARE edad: entero
ASSIGN edad, 20
T1 = edad + 1
ASSIGN edad, T1
PRINT edad
```

---


---

## Flujo explicado por fases

La página ahora incluye un mini menú para explicar el recorrido completo del compilador:

1. **Fuente:** es el texto escrito por el usuario en el editor.
2. **Léxico:** separa el texto en tokens, como palabras reservadas, identificadores, números, operadores y símbolos.
3. **Sintáctico:** revisa la forma de las instrucciones, por ejemplo si falta `;`, `=`, `)` o `{`.
4. **Semántico:** revisa el significado, por ejemplo variables no declaradas, tipos incompatibles y condiciones que no son lógicas.
5. **Código intermedio:** muestra una representación didáctica de lo que el analizador entendió.

Esta organización ayuda a que la audiencia no pierda el hilo antes de llegar a la demo.

> Nota técnica: el proyecto no construye ni muestra un AST/árbol sintáctico abstracto. La explicación se mantiene en tokens, reglas básicas, tabla de símbolos y validaciones semánticas.

## 9. Limitaciones del proyecto

Este proyecto es académico y didáctico. Por eso tiene límites intencionales:

- No genera código máquina real.
- No implementa un parser completo como un compilador profesional.
- No maneja funciones complejas ni clases.
- No maneja todos los ámbitos posibles de un lenguaje real.
- No busca reemplazar herramientas como ANTLR, Flex/Bison o LLVM.

Estas limitaciones son aceptables porque el objetivo es explicar la idea central del análisis semántico de forma clara, apoyándose en una sintaxis básica para mostrar errores entendibles.

---

## 10. Posibles mejoras futuras

Ideas para ampliar el proyecto:

- Agregar soporte para funciones.
- Agregar ámbitos locales más completos.
- Agregar arreglos.
- Exportar los resultados como PDF.
- Agregar modo oscuro/claro.
- Agregar más ejemplos de errores.
- Agregar backend para guardar análisis anteriores.

---

## 11. Explicación corta para el profesor

> El proyecto implementa una simulación didáctica de un analizador para un lenguaje pequeño. A partir del código fuente, identifica tokens, realiza validaciones sintácticas básicas, registra variables en una tabla de símbolos y aplica reglas de tipo para detectar errores como variables no declaradas, redeclaraciones, asignaciones incompatibles y condiciones no lógicas.
