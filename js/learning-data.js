/**
 * Portal USB — Centro de Aprendizaje (Fase 14A)
 * Contenido académico: Teoría de Compiladores — USB Cúcuta
 */
const LEARNING_DATA = {
  guide: [
    {
      id: 'lex', title: 'OVA 1 — Analizador Léxico', ova: 'Marco & Cristian', color: 'lex',
      steps: [
        { heading: 'Objetivo del análisis léxico', text: 'Primera fase del compilador: transformar la cadena de caracteres del programa fuente en una secuencia de tokens significativos, descartando espacios y comentarios irrelevantes para el parser.' },
        { heading: 'Qué es un token', text: 'Unidad léxica indivisible con tipo y lexema. Ejemplos: identificador x, palabra reservada int, operador =, literal 10, delimitador ;.' },
        { heading: 'Categorías de tokens', text: 'Palabras reservadas (if, while, int), identificadores, literales numéricos, operadores aritméticos/lógicos, delimitadores ( ), { }, ; y, en algunos lenguajes, comentarios tratados aparte.' },
        { heading: 'Cómo usar la OVA', text: 'Abra la OVA desde el portal, ingrese código MiniC en el editor y ejecute el análisis léxico. Observe la tabla con tipo, valor y posición de cada token generado.' },
        { heading: 'Interpretación de resultados', text: 'La salida ordenada refleja el flujo que recibirá el analizador sintáctico. Cada fila debe corresponder a un lexema válido según las expresiones regulares del lenguaje.' },
        { heading: 'Errores léxicos comunes', text: 'Caracteres no reconocidos (@, # fuera de contexto), cadenas sin cerrar, números mal formados o símbolos aislados que no pertenecen al alfabeto del lenguaje.' }
      ]
    },
    {
      id: 'syn', title: 'OVA 2 — Analizador Sintáctico', ova: 'Fabian & Sofi', color: 'syn',
      steps: [
        { heading: 'Qué es una gramática', text: 'Conjunto de reglas (producciones) que definen la estructura sintáctica válida del lenguaje. En compiladores suele usarse una gramática libre de contexto (GLC).' },
        { heading: 'Qué es un parser', text: 'Analizador sintáctico que consume tokens y verifica si la secuencia es derivable desde el símbolo inicial de la gramática. Puede ser descendente o ascendente.' },
        { heading: 'Qué es un AST', text: 'Árbol de Sintaxis Abstracta: representación jerárquica del programa donde nodos internos son operadores o estructuras y las hojas son operandos o identificadores.' },
        { heading: 'Interpretar errores sintácticos', text: 'El mensaje indica token inesperado o producción incompleta. Revise la línea señalada: suele faltar ;, ), } o hay un keyword fuera de lugar.' },
        { heading: 'Cómo utilizar la OVA', text: 'Configure la API si es necesario, escriba código válido léxicamente y ejecute el análisis. Explore el AST visual (D3.js), tokens y panel de errores del parser.' }
      ]
    },
    {
      id: 'sem', title: 'OVA 3 — Analizador Semántico', ova: 'Kevin & Gabriel', color: 'sem',
      steps: [
        { heading: 'Tabla de símbolos', text: 'Estructura que almacena identificadores con atributos: nombre, tipo, ámbito (global/local), línea de declaración y uso. Es fundamental para verificación estática.' },
        { heading: 'Reglas semánticas', text: 'Restricciones más allá de la gramática: declarar antes de usar, no redeclarar en el mismo ámbito, compatibilidad de tipos en asignaciones y llamadas a funciones.' },
        { heading: 'Tipos de datos', text: 'El compilador asigna o verifica tipos (int, float, void, etc.). Operaciones entre tipos incompatibles generan error semántico aunque la sintaxis sea correcta.' },
        { heading: 'Errores semánticos', text: 'Variable no declarada, redeclaración, asignación de string a int, número incorrecto de argumentos en funciones, return incompatible con el tipo declarado.' },
        { heading: 'Cómo usar la OVA', text: 'Ingrese programas MiniC y ejecute el análisis semántico. Revise advertencias en el panel y la tabla de símbolos actualizada tras cada validación.' }
      ]
    },
    {
      id: 'tac', title: 'OVA 4 — Mini Compilador TAC', ova: 'Islender & Jhoan', color: 'tac',
      steps: [
        { heading: 'Flujo completo del compilador', text: 'Léxico → Sintaxis → Semántica → Generación de código intermedio (TAC/cuádruplas). Esta OVA integra el pipeline hasta cuádruplas en un solo entorno.' },
        { heading: 'Tokens', text: 'Primera salida visible del pipeline interno. Confirme que el lexer reconoce correctamente antes de interpretar AST o TAC.' },
        { heading: 'AST', text: 'Representación estructural usada por el generador de código intermedio para recorrer expresiones y sentencias de control.' },
        { heading: 'Cuádruplas', text: 'Instrucciones de tres direcciones en formato (operador, arg1, arg2, resultado). Ejemplo: (+, a, b, t1).' },
        { heading: 'Tabla de símbolos', text: 'Variables del programa con tipo y ámbito; complementa la generación de TAC al resolver nombres y temporales.' },
        { heading: 'Interpretación del código intermedio', text: 'Lea secuencialmente: asignaciones, operaciones aritméticas, saltos condicionales (if/while) mediante etiquetas y goto implícitos en cuádruplas.' }
      ]
    },
    {
      id: 'aut', title: 'OVA 5 — Simulador de Autómatas (FASS)', ova: 'Ronald & Johel', color: 'aut',
      steps: [
        { heading: 'Diferencia entre AFD y AFN', text: 'AFD: a lo sumo una transición por (estado, símbolo). AFN: puede haber varias transiciones o transiciones ε sin consumir símbolo.' },
        { heading: 'Estados', text: 'Nodos del autómata que representan configuraciones de reconocimiento. Se nombran q0, q1, etc.' },
        { heading: 'Transiciones', text: 'Flechas etiquetadas con símbolos del alfabeto Σ (o ε en AFN). Definen el movimiento entre estados al leer la cadena.' },
        { heading: 'Estado inicial', text: 'Único estado desde el cual comienza la simulación; suele marcarse con flecha de entrada.' },
        { heading: 'Estado de aceptación', text: 'Estado final: si la cadena termina en un estado de aceptación, la cadena es reconocida por el lenguaje del autómata.' },
        { heading: 'Validación de cadenas', text: 'Ingrese la cadena en FASS y observe la traza paso a paso, tabla de transiciones e indicador de aceptación o rechazo.' }
      ]
    }
  ],

  examples: [
    { id: 'ex1', title: 'Declaración de variables', topic: 'Semántica / TAC',
      code: 'int x;\nint y;\nx = 10;\ny = x;',
      explanation: 'Se declaran dos enteros y se asigna el valor de x a y. El analizador registra ambos identificadores en la tabla de símbolos antes de validar usos.',
      result: 'Sin errores. TAC aproximado: (=, 10, _, x); (=, x, _, y).' },
    { id: 'ex2', title: 'Operaciones aritméticas', topic: 'Sintaxis / TAC',
      code: 'int a = 5;\nint b = 3;\nint c = a + b * 2;',
      explanation: 'La multiplicación tiene mayor precedencia que la suma. El AST anida * más profundo que +.',
      result: 'Valor de c = 11. Cuádruplas: temp para b*2, luego suma con a.' },
    { id: 'ex3', title: 'Precedencia de operadores', topic: 'Sintaxis',
      code: 'int r = 2 + 3 * 4;',
      explanation: 'Sin paréntesis, 3*4 se evalúa primero (precedencia estándar). r = 14, no 20.',
      result: 'AST: nodo + con hijo 2 y subárbol * (3, 4).' },
    { id: 'ex4', title: 'Expresiones con paréntesis', topic: 'Sintaxis',
      code: 'resultado = (10 + 5) * (3 - 1);',
      explanation: 'Los paréntesis alteran la precedencia natural, forzando suma y resta antes de la multiplicación.',
      result: 'resultado = 30. Subárboles (10+5) y (3-1) bajo un nodo *.' },
    { id: 'ex5', title: 'Condicional IF', topic: 'TAC',
      code: 'if (x > 0) {\n  print(x);\n} else {\n  print(0);\n}',
      explanation: 'Estructura de control bifurcada. El generador TAC introduce etiquetas y saltos condicionales.',
      result: 'Cuádruplas: comparación >, goto a rama then/else, llamadas print.' },
    { id: 'ex6', title: 'Ciclo WHILE', topic: 'TAC',
      code: 'int i = 0;\nwhile (i < 3) {\n  print(i);\n  i = i + 1;\n}',
      explanation: 'Bucle pre-test: se evalúa la condición antes de cada iteración. Requiere etiqueta de inicio y salto al final del cuerpo.',
      result: 'TAC con L_inicio, condición i<3, cuerpo, incremento, goto L_inicio.' },
    { id: 'ex7', title: 'Error léxico', topic: 'Léxico',
      code: 'int x = 10;\nint y = @5;',
      explanation: 'El carácter @ no está definido en el alfabeto léxico de MiniC. El lexer no puede clasificarlo como token válido.',
      result: 'Error léxico en la línea de @5. El análisis sintáctico no debería continuar sin corregir.' },
    { id: 'ex8', title: 'Error sintáctico', topic: 'Sintaxis',
      code: 'int x = 10\nint y = 5;',
      explanation: 'Falta el punto y coma que delimita la primera sentencia. El parser encuentra int cuando esperaba ; o fin de bloque.',
      result: 'Error sintáctico: token inesperado int.' },
    { id: 'ex9', title: 'Error semántico', topic: 'Semántica',
      code: 'int x = 10;\nprint(z);',
      explanation: 'z no aparece en la tabla de símbolos. La sintaxis es válida pero viola la regla de declaración previa.',
      result: 'Error semántico: identificador z no declarado.' },
    { id: 'ex10', title: 'Generación de TAC', topic: 'TAC',
      code: 'int a = 2;\nint b = 3;\nint c = a + b;',
      explanation: 'Programa mínimo que recorre léxico, parser, semántica y generador de cuádruplas.',
      result: '(=, 2, _, a); (=, 3, _, b); (+, a, b, t1); (=, t1, _, c).' }
  ],

  quiz: [
    { cat: 'lex', q: '¿Cuál es el objetivo principal del analizador léxico?', options: ['Construir el AST', 'Generar tokens a partir del código fuente', 'Optimizar cuádruplas', 'Ejecutar el programa'], correct: 1 },
    { cat: 'lex', q: 'Un lexema inválido produce un error…', options: ['Sintáctico', 'Léxico', 'Semántico', 'De enlace'], correct: 1 },
    { cat: 'lex', q: 'La palabra reservada while se clasifica como token tipo…', options: ['Identificador', 'Keyword', 'Literal', 'Operador'], correct: 1 },
    { cat: 'lex', q: 'El autómata del lexer reconoce…', options: ['Cuádruplas', 'Patrones de tokens', 'Tabla de símbolos', 'Errores de tipos'], correct: 1 },
    { cat: 'syn', q: 'Una gramática libre de contexto define…', options: ['Solo tipos de datos', 'Reglas de estructura sintáctica', 'Direcciones de memoria', 'Estados finales'], correct: 1 },
    { cat: 'syn', q: 'El parser consume como entrada…', options: ['Caracteres sueltos', 'Secuencia de tokens', 'Código máquina', 'Cuádruplas'], correct: 1 },
    { cat: 'syn', q: 'En el AST, las hojas suelen representar…', options: ['Producciones de la gramática', 'Identificadores o literales', 'Estados del autómata', 'Etiquetas de salto'], correct: 1 },
    { cat: 'syn', q: 'Omitir un punto y coma entre sentencias suele causar error…', options: ['Léxico', 'Sintáctico', 'Semántico', 'Runtime'], correct: 1 },
    { cat: 'sem', q: 'La tabla de símbolos almacena principalmente…', options: ['Tokens sin clasificar', 'Información de identificadores', 'Transiciones del autómata', 'Cuádruplas generadas'], correct: 1 },
    { cat: 'sem', q: 'Usar una variable no declarada es error…', options: ['Léxico', 'Sintáctico', 'Semántico', 'De preprocesador'], correct: 2 },
    { cat: 'sem', q: 'La verificación de compatibilidad de tipos ocurre en fase…', options: ['Léxica', 'Sintáctica', 'Semántica', 'Léxico del linker'], correct: 2 },
    { cat: 'sem', q: 'El ámbito (scope) determina…', options: ['Velocidad del CPU', 'Visibilidad de un identificador', 'Color del AST', 'Tamaño del autómata'], correct: 1 },
    { cat: 'tac', q: 'TAC significa…', options: ['Three Address Code', 'Token Analysis Compiler', 'Tree And Compiler', 'Type Assignment Check'], correct: 0 },
    { cat: 'tac', q: 'Una cuádrupla típica tiene la forma…', options: ['(op, arg1, arg2, res)', '(estado, símbolo)', '(token, línea)', '(tipo, nombre)'], correct: 0 },
    { cat: 'tac', q: 'Las variables temporales en TAC suelen denominarse…', options: ['q0, q1', 't1, t2', 'L1, L2', 'main, aux'], correct: 1 },
    { cat: 'tac', q: 'El código intermedio facilita…', options: ['Solo depuración visual', 'Optimización y generación de código objetivo', 'Análisis léxico únicamente', 'Diseño de autómatas'], correct: 1 },
    { cat: 'aut', q: 'En un AFD, por cada (estado, símbolo) hay como máximo…', options: ['Cero transiciones', 'Una transición', 'Infinitas transiciones', 'Dos estados finales'], correct: 1 },
    { cat: 'aut', q: 'Un AFN puede incluir transiciones…', options: ['Solo con símbolos del alfabeto', 'Épsilon (sin consumir símbolo)', 'Solo hacia estados finales', 'Sin estado inicial'], correct: 1 },
    { cat: 'aut', q: 'Una cadena es aceptada si la simulación termina en…', options: ['Cualquier estado', 'Un estado de aceptación', 'El estado inicial únicamente', 'Estado trampa siempre'], correct: 1 },
    { cat: 'aut', q: 'Los autómatas finitos modelan el reconocimiento de…', options: ['Errores semánticos', 'Lenguajes regulares (tokens)', 'Tablas hash', 'Cuádruplas'], correct: 1 }
  ],

  hangmanWords: [
    'TOKEN', 'LEXICO', 'SINTAXIS', 'SEMANTICA', 'COMPILADOR', 'AUTOMATA',
    'GRAMATICA', 'PARSER', 'AST', 'CUADRUPLA', 'OPTIMIZACION', 'INTERPRETE',
    'AFD', 'AFN', 'RECURSION'
  ],

  wordSearchWords: [
    'TOKEN', 'AST', 'AFD', 'AFN', 'PARSER', 'LEXICO', 'SINTAXIS', 'SEMANTICA',
    'COMPILADOR', 'TAC', 'OPTIMIZACION', 'RECURSION', 'GRAMATICA', 'TERMINAL', 'NO_TERMINAL'
  ],

  matchingPairs: [
    { term: 'TOKEN', definition: 'Unidad léxica básica' },
    { term: 'AST', definition: 'Árbol sintáctico abstracto' },
    { term: 'AFD', definition: 'Autómata finito determinista' },
    { term: 'AFN', definition: 'Autómata finito no determinista' },
    { term: 'PARSER', definition: 'Analizador sintáctico' },
    { term: 'SEMANTICA', definition: 'Significado del programa' },
    { term: 'LEXICO', definition: 'Reconocimiento de tokens' },
    { term: 'TAC', definition: 'Código de tres direcciones' },
    { term: 'GRAMATICA', definition: 'Reglas sintácticas' },
    { term: 'SIMBOLO', definition: 'Elemento de una producción' }
  ]
};

window.LEARNING_DATA = LEARNING_DATA;
