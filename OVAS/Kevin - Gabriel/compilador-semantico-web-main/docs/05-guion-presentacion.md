# 05. Guion para presentar el proyecto

Este guion está pensado para explicar el proyecto en clase de forma sencilla.

Puedes usarlo como libreto mientras muestras la página web.

---

## 1. Introducción

**Qué mostrar:** sección de inicio de la página.

**Qué decir:**

> Buenos días. En esta presentación voy a mostrar un compilador semántico web. La idea del proyecto es explicar de forma visual cómo un compilador revisa el código, incluyendo errores básicos de sintaxis y especialmente errores semánticos.  
>  
> El objetivo no es crear un compilador profesional completo, sino una herramienta didáctica para entender cómo el compilador revisa si un programa tiene sentido. En esta versión no estoy mostrando AST o árbol sintáctico porque el proyecto no trabaja con árboles; se enfoca en tokens, tabla de símbolos, errores y código intermedio didáctico.

---

## 2. Relación con las fases del compilador

**Qué mostrar:** sección de teoría, especialmente la línea de flujo.

**Qué decir:**

> En un compilador normalmente pasamos por varias fases. Primero está el código fuente, luego el análisis léxico, después el análisis sintáctico y luego el análisis semántico.  
>  
> El análisis léxico identifica las palabras o tokens. El análisis sintáctico revisa si el código tiene una estructura válida. Pero el análisis semántico va más allá: revisa si lo que escribimos tiene sentido.

**Analogía:**

> Por ejemplo, la frase “la silla come arroz” puede estar escrita correctamente desde el punto de vista gramatical, pero no tiene sentido. En programación pasa algo parecido: una instrucción puede estar bien escrita, pero ser incorrecta porque intenta guardar un texto en una variable numérica.

---

## 3. Mini menú de fases del compilador

**Qué mostrar:** el mini menú dentro de la sección de teoría. Haz clic en Fuente, Léxico, Sintáctico, Semántico y Código intermedio.

**Qué decir:**

> Antes de probar el editor, voy a explicar el camino general. El código empieza como fuente, que es simplemente el texto escrito por el programador. Luego el análisis léxico lo separa en tokens. Después el análisis sintáctico revisa si la estructura está bien escrita. Más adelante el análisis semántico revisa si lo escrito tiene sentido. Finalmente se puede mostrar una representación de código intermedio.
>
> Esto ayuda a entender que el compilador no salta directamente al resultado, sino que revisa el programa paso a paso.

**Frase sencilla:**

> Primero se lee el texto, luego se separa, después se revisa la forma, luego el significado y finalmente se resume lo que el compilador entendió.

---

## 4. ¿Qué revisa el análisis semántico?

**Qué mostrar:** tarjetas de la sección “¿Qué hace el análisis semántico?”.

**Qué decir:**

> En este proyecto se trabajan tres ideas principales. Primero, revisar declaraciones, es decir, comprobar que una variable exista antes de usarla. Segundo, validar tipos, para evitar mezclar datos incompatibles. Y tercero, construir una tabla de símbolos, que funciona como una memoria del compilador donde se guardan las variables declaradas.

---

## 5. MiniLenguaje USB

**Qué mostrar:** sección “MiniLenguaje USB”.

**Qué decir:**

> Para que la explicación sea clara, el proyecto usa un lenguaje pequeño llamado MiniLenguaje USB. Este lenguaje tiene cuatro tipos de datos: entero, decimal, texto y lógico.  
>  
> También permite declaraciones, asignaciones, impresiones y condiciones sencillas. Al ser pequeño, es más fácil ver cómo trabaja el análisis semántico sin perdernos en reglas demasiado complejas.

---

## 6. Demostración con programa correcto

**Qué mostrar:** sección demo. Presionar “Ejemplo correcto” y luego “Analizar código”.

**Qué decir:**

> Primero voy a ejecutar un programa correcto. Aquí se declara una edad como entero, un promedio como decimal, un nombre como texto y una variable aprobado como lógica.  
>  
> Cuando ejecuto el análisis, el sistema indica que el programa es semánticamente correcto porque las variables existen y los tipos son compatibles.

---

## 7. Explicar tokens

**Qué mostrar:** pestaña “Tokens”.

**Qué decir:**

> En la pestaña de tokens podemos ver cómo el sistema separa el código en partes pequeñas. Por ejemplo, la palabra `entero` se reconoce como palabra reservada, `edad` como identificador, el signo igual como operador y el número como valor numérico.  
>  
> Esto se relaciona con el análisis léxico, aunque nuestro enfoque principal es la fase semántica.

---

## 8. Explicar tabla de símbolos

**Qué mostrar:** pestaña “Tabla de símbolos”.

**Qué decir:**

> La tabla de símbolos es una estructura muy importante dentro de un compilador. Aquí se guarda la información de cada variable: su nombre, su tipo, la línea donde fue declarada, su valor inicial y su ámbito.  
>  
> Se puede entender como una lista de contactos del compilador. Si más adelante el programa usa una variable, el compilador revisa esta tabla para saber si existe y qué tipo tiene.

---

## 9. Demostración con errores

**Qué mostrar:** botón “Ejemplo con errores” y luego “Analizar código”.

**Qué decir:**

> Ahora voy a mostrar un programa con errores de sintaxis y semántica. Este ejemplo es útil porque permite ver dos cosas: primero, cuando falta algo en la forma del código, como `;` o `=`, y segundo, cuando el código está escrito pero no tiene sentido, por ejemplo guardar texto en una variable entera.

**Explicar errores uno por uno:**

> Por ejemplo, si declaro `edad` como entero y luego intento asignarle `nombre`, que es texto, el sistema detecta una incompatibilidad de tipos.  
>  
> También se detecta cuando una variable se usa sin haber sido declarada. Esto es importante porque el compilador no puede adivinar qué tipo de dato tiene una variable que no existe en la tabla de símbolos.  
>  
> Otro error es declarar dos veces la misma variable en el mismo ámbito.

---

## 10. Demostración con condicional

**Qué mostrar:** botón “Condicional” y luego “Analizar código”.

**Qué decir:**

> En este ejemplo se revisa una condición. Una condición dentro de un `si` debe producir un valor lógico, es decir, verdadero o falso.  
>  
> Por eso una expresión como `edad >= 18` es válida, porque devuelve verdadero o falso. En cambio, usar solamente `edad` como condición genera error porque `edad` es un número, no un valor lógico.

---

## 11. Código intermedio

**Qué mostrar:** pestaña “Código intermedio”.

**Qué decir:**

> Después de validar que el programa tiene sentido, el compilador puede generar una representación intermedia. En este proyecto se muestra de forma didáctica, no como código máquina real.  
>  
> La idea es enseñar que el compilador transforma el código fuente poco a poco hasta llevarlo a una forma más fácil de procesar.

---

## 12. Despliegue del proyecto

**Qué mostrar:** sección final de despliegue.

**Qué decir:**

> Para publicar el proyecto se usa un flujo con GitHub, Dokploy y Cosmos Cloud. Primero el código queda guardado en GitHub. Luego Dokploy toma el repositorio, construye el contenedor con Docker y lo sirve mediante Nginx. Finalmente, Cosmos Cloud funciona como reverse proxy para acceder a la página desde un dominio público.

**Frase sencilla:**

> GitHub guarda el código, Dokploy lo ejecuta y Cosmos lo publica con dominio.

---

## 13. Cierre

**Qué decir:**

> En conclusión, este proyecto permite entender el análisis semántico de una forma más visual. La demo muestra que el compilador revisa estructura básica y también significado. Gracias a eso puede detectar errores como falta de punto y coma, variables mal escritas, variables no declaradas, tipos incompatibles y condiciones incorrectas antes de que el programa siga a fases posteriores.

---

## 14. Preguntas que podrían hacerte

### ¿Este proyecto es un compilador completo?

Respuesta sugerida:

> No es un compilador completo de producción. Es una simulación académica enfocada en la fase de análisis semántico, con validaciones sintácticas básicas para explicar mejor los errores.

### ¿Por qué no genera código ejecutable real?

Respuesta sugerida:

> Porque el objetivo principal es explicar la validación semántica. La generación de código real pertenece a fases posteriores del compilador.

### ¿Qué diferencia hay entre error sintáctico y semántico?

Respuesta sugerida:

> Un error sintáctico ocurre cuando la estructura está mal escrita. Un error semántico ocurre cuando la estructura puede estar bien escrita, pero la instrucción no tiene sentido. Por ejemplo, asignar un texto a una variable entera.

### ¿Para qué sirve la tabla de símbolos?

Respuesta sugerida:

> Sirve para guardar información de las variables e identificadores. El compilador la usa para saber si una variable existe, qué tipo tiene y si puede participar en una operación.

### ¿Por qué usaste Docker, Dokploy y Cosmos?

Respuesta sugerida:

> Porque permiten publicar el proyecto de forma ordenada. Docker empaqueta la aplicación, Dokploy facilita el despliegue desde GitHub y Cosmos permite exponerla con un dominio mediante reverse proxy.
