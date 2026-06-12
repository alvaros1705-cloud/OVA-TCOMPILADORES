# Pruebas de errores para la presentación

Este documento contiene casos cortos que puedes pegar en el editor para demostrar cómo el proyecto detecta errores de sintaxis y errores semánticos.

---

## 1. Programa correcto

```txt
entero edad = 20;
texto nombre = "Gabriel";
logico mayorEdad = edad >= 18;

imprimir(nombre);
imprimir(mayorEdad);
```

**Qué debe pasar:**

- No aparecen errores.
- La tabla de símbolos muestra `edad`, `nombre` y `mayorEdad`.
- La condición `edad >= 18` se reconoce como tipo `logico`.

---

## 2. Falta punto y coma

```txt
entero edad = 20
texto nombre = "Gabriel";
```

**Qué debe detectar:**

- Error de sintaxis en la línea 1.
- El mensaje debe indicar que falta `;` al final de la declaración.

**Cómo explicarlo:**

> Este error es sintáctico porque la instrucción no está completamente escrita según las reglas del lenguaje.

---

## 3. Falta el operador igual

```txt
decimal promedio 4.5;
```

**Qué debe detectar:**

- Error de sintaxis.
- El sistema explica que no puede asociar `promedio` con `4.5` porque falta `=`.

**Forma correcta:**

```txt
decimal promedio = 4.5;
```

---

## 4. Asignación con tipo incompatible

```txt
entero edad = 20;
texto nombre = "Gabriel";

edad = nombre;
```

**Qué debe detectar:**

- Error semántico.
- `edad` es de tipo `entero`, pero `nombre` es de tipo `texto`.

**Cómo explicarlo:**

> La instrucción está bien escrita, pero no tiene sentido para el lenguaje porque un número entero no puede recibir un texto.

---

## 5. Variable mal escrita

```txt
entero edad = 20;

eda = 30;
```

**Qué debe detectar:**

- Error semántico.
- La variable `eda` no fue declarada.
- El sistema puede sugerir `edad` porque es una variable parecida.

**Cómo explicarlo:**

> El compilador no adivina automáticamente. Si una variable se escribe diferente, la trata como otra variable.

---

## 6. Diferencia entre mayúsculas y minúsculas

```txt
texto nombre = "Gabriel";

imprimir(Nombre);
```

**Qué debe detectar:**

- Error semántico.
- `Nombre` no fue declarada.
- Puede sugerir `nombre`.

**Cómo explicarlo:**

> En muchos lenguajes, `nombre` y `Nombre` no son lo mismo porque el identificador es sensible a mayúsculas y minúsculas.

---

## 7. Falta paréntesis en imprimir

```txt
texto nombre = "Gabriel";

imprimir(nombre;
```

**Qué debe detectar:**

- Error de sintaxis.
- Falta el paréntesis de cierre `)`.

**Forma correcta:**

```txt
imprimir(nombre);
```

---

## 8. Condición no lógica

```txt
entero edad = 20;

si (edad) {
  imprimir("Hola");
}
```

**Qué debe detectar:**

- Error semántico.
- La condición de `si` debe ser `logico`, pero `edad` es `entero`.

**Forma correcta:**

```txt
si (edad >= 18) {
  imprimir("Hola");
}
```

---

## Frase para la exposición

> La diferencia importante es que un error de sintaxis ocurre cuando la forma del código está mal escrita, como faltar un punto y coma. En cambio, un error semántico ocurre cuando el código sí tiene forma válida, pero no tiene sentido, como guardar un texto en una variable entera.
