/*
  analyzer.js
  Motor principal del Compilador Semantico.

  Responsabilidades:
  - Manejar botones, pestanas y cambios de fase.
  - Tokenizar el codigo escrito por el usuario.
  - Validar sintaxis basica del minilenguaje.
  - Construir tabla de simbolos.
  - Evaluar compatibilidad de tipos.
  - Detectar errores semanticos.
  - Renderizar errores, tokens, simbolos, pasos y codigo intermedio.

  Nota para mantenimiento:
  Este archivo trabaja completamente en el navegador. Si se desea proteger
  la logica del analizador, lo ideal seria mover la funcion analyze()
  a un backend y consumirla desde el frontend mediante una API.
*/

// Informacion mostrada en la seccion de fases del compilador.
const phaseInfo = {
  fuente: {
    tag: 'Entrada',
    title: 'Código fuente',
    body: 'Es el programa original escrito por el usuario. En esta etapa el sistema recibe el texto completo y lo prepara para iniciar el análisis.',
    checks: 'toma el contenido tal como fue escrito, antes de clasificarlo o validarlo.',
    next: 'el texto debe dividirse en piezas con significado, como palabras reservadas, identificadores, números y símbolos.',
    demo: 'el contenido visible en el editor.'
  },
  lexico: {
    tag: 'Clasificación inicial',
    title: 'Análisis léxico',
    body: 'Transforma el texto en tokens. Cada token representa una pieza reconocible del lenguaje, por ejemplo <code>entero</code>, <code>edad</code>, <code>=</code>, <code>20</code> o <code>;</code>.',
    checks: 'identifica palabras reservadas, identificadores, números, cadenas, operadores y símbolos.',
    next: 'después de separar las piezas, es necesario revisar si están organizadas con una forma válida.',
    demo: 'la pestaña Tokens con cada lexema y su categoría.'
  },
  sintactico: {
    tag: 'Estructura',
    title: 'Análisis sintáctico',
    body: 'Comprueba que cada instrucción siga la forma esperada del lenguaje. Por ejemplo, una declaración válida debe verse como <code>tipo nombre = valor;</code>.',
    checks: 'detecta faltas de <code>;</code>, <code>=</code>, paréntesis, llaves o expresiones incompletas.',
    next: 'aunque una instrucción esté bien escrita, todavía falta verificar si tiene sentido según sus tipos y símbolos.',
    demo: 'los errores marcados como Sintaxis.'
  },
  semantico: {
    tag: 'Significado',
    title: 'Análisis semántico',
    body: 'Valida que el programa tenga sentido: variables declaradas, tipos compatibles, expresiones correctas y condiciones lógicas coherentes.',
    checks: 'revisa usos de variables, redeclaraciones, asignaciones incompatibles y comparaciones inválidas.',
    next: 'cuando el significado es válido, se puede expresar el resultado en una forma intermedia más fácil de procesar.',
    demo: 'la tabla de símbolos, el resumen y los errores semánticos.'
  },
  intermedio: {
    tag: 'Representación',
    title: 'Código intermedio',
    body: 'Genera una versión resumida del programa entendido por el analizador. No es código máquina, pero sí una representación útil del resultado.',
    checks: 'resume declaraciones, asignaciones, impresiones y condiciones procesadas.',
    next: 'a partir de aquí podrían venir optimizaciones o etapas posteriores en un compilador más completo.',
    demo: 'la pestaña Código intermedio.'
  }
};

// Ejemplos precargados que se cargan en el editor desde los botones de la demo.
const examples = {
  ok: `// Programa correcto
entero edad = 20;
decimal promedio = 4.3;
texto nombre = "Gabriel";
logico aprobado = promedio >= 3.0;

edad = edad + 1;
imprimir(nombre);
imprimir(aprobado);`,

  errors: `// Programa con errores
eentero edad = 20;
texto nombre = "Gabriel"
decimal promedio 4.5;

edad = nombre;
eda = 30;
imprimir(resultado;

si (edad) {
  imprimir("La condición no es lógica");
}`,

  logic: `// Uso de condición lógica
entero edad = 19;
logico mayorEdad = edad >= 18;

si (mayorEdad) {
  texto mensaje = "Puede ingresar";
  imprimir(mensaje);
}

si (edad) {
  imprimir("Esto genera error semántico");
}`
};

// Palabras reservadas, tipos de datos y etiquetas usadas por el tokenizer.
const TYPE_KEYWORDS = new Set(['entero', 'decimal', 'texto', 'logico']);
const KEYWORDS = new Set([...TYPE_KEYWORDS, 'verdadero', 'falso', 'imprimir', 'si', 'sino']);
const TOKEN_LABELS = {
  keyword: 'Palabra reservada',
  identifier: 'Identificador',
  number: 'Número',
  string: 'Cadena',
  operator: 'Operador',
  symbol: 'Símbolo',
  unknown: 'No reconocido'
};

// Referencias a elementos HTML que analyzer.js necesita manipular.
const codeInput = document.getElementById('codeInput');
const runButton = document.getElementById('runButton');
const clearButton = document.getElementById('clearButton');
const verdict = document.getElementById('verdict');
const tokenCount = document.getElementById('tokenCount');
const symbolCount = document.getElementById('symbolCount');
const errorCount = document.getElementById('errorCount');

const panels = {
  errors: document.getElementById('errors'),
  symbols: document.getElementById('symbols'),
  tokens: document.getElementById('tokens'),
  intermediate: document.getElementById('intermediate'),
  steps: document.getElementById('steps')
};

codeInput.value = '';
codeInput.placeholder = 'Escribe aquí el código que deseas analizar. Ejemplo: entero edad = 20;';

runButton.addEventListener('click', () => renderAnalysis(analyze(codeInput.value)));
clearButton.addEventListener('click', () => {
  codeInput.value = '';
  renderAnalysis(analyze(''));
  codeInput.focus();
});

document.querySelectorAll('[data-example]').forEach(button => {
  button.addEventListener('click', () => {
    codeInput.value = examples[button.dataset.example];
    renderAnalysis(analyze(codeInput.value));
  });
});

// Control de pestanas: muestra el panel seleccionado y oculta los demas.
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    panels[tab.dataset.tab].classList.add('active');
  });
});

const phaseDetail = document.getElementById('phaseDetail');
// Control del flujo de fases: actualiza la tarjeta explicativa segun la fase seleccionada.
document.querySelectorAll('.phase-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.phase-button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const info = phaseInfo[button.dataset.phase];
    if (!info || !phaseDetail) return;
    phaseDetail.innerHTML = `
      <span class="phase-detail__tag">${htmlEscape(info.tag)}</span>
      <h4>${htmlEscape(info.title)}</h4>
      <p>${info.body}</p>
      <ul>
        <li><strong>Qué revisa:</strong> ${info.checks}</li>
        <li><strong>Por qué pasa a la siguiente fase:</strong> ${info.next}</li>
        <li><strong>Qué se ve:</strong> ${info.demo}</li>
      </ul>`;
  });
});

// Escapa caracteres HTML para evitar que el codigo del usuario se interprete como etiquetas reales.
function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Elimina comentarios de una linea antes de analizarla.
function removeComment(line) {
  let inString = false;
  let result = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && line[i - 1] !== '\\') inString = !inString;
    if (!inString && char === '/' && next === '/') break;
    result += char;
  }
  return result;
}

// Convierte una linea de codigo en tokens: palabras, numeros, cadenas, operadores y simbolos.
function tokenizeLine(line, lineNumber) {
  const source = removeComment(line);
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    if (/\s/.test(char)) { i++; continue; }

    if (char === '"') {
      let value = '"';
      i++;
      let closed = false;
      while (i < source.length) {
        value += source[i];
        if (source[i] === '"' && source[i - 1] !== '\\') { closed = true; i++; break; }
        i++;
      }
      tokens.push({ type: 'string', value, line: lineNumber, closed });
      continue;
    }

    const two = source.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) {
      tokens.push({ type: 'operator', value: two, line: lineNumber });
      i += 2;
      continue;
    }

    if ('+-*/%=<>!'.includes(char)) {
      tokens.push({ type: 'operator', value: char, line: lineNumber });
      i++;
      continue;
    }

    if (';(){}.,'.includes(char)) {
      tokens.push({ type: 'symbol', value: char, line: lineNumber });
      i++;
      continue;
    }

    if (/\d/.test(char)) {
      let value = char;
      let dotCount = 0;
      i++;
      while (i < source.length && /[\d.]/.test(source[i])) {
        if (source[i] === '.') dotCount++;
        value += source[i];
        i++;
      }
      tokens.push({ type: 'number', value, line: lineNumber, malformed: dotCount > 1 });
      continue;
    }

    if (/[A-Za-z_ÁÉÍÓÚáéíóúÑñ]/.test(char)) {
      let value = char;
      i++;
      while (i < source.length && /[\wÁÉÍÓÚáéíóúÑñ]/.test(source[i])) {
        value += source[i];
        i++;
      }
      tokens.push({ type: KEYWORDS.has(value) ? 'keyword' : 'identifier', value, line: lineNumber });
      continue;
    }

    tokens.push({ type: 'unknown', value: char, line: lineNumber });
    i++;
  }

  return tokens;
}

function tokenize(source) {
  return source.split('\n').flatMap((line, index) => tokenizeLine(line, index + 1));
}

function analyze(source) {
  const allTokens = tokenize(source);
  const issues = [];
  const symbols = [];
  const intermediate = [];
  const steps = [];
  const scopes = ['global'];
  let blockCounter = 0;
  let openedBlocks = 0;
  const isEmpty = source.trim().length === 0;

  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const lineTokens = tokenizeLine(lines[index], lineNumber);
    if (lineTokens.length === 0) continue;

    lineTokens.filter(t => t.type === 'unknown').forEach(t => {
      issues.push(issue('Sintaxis', lineNumber, `El carácter '${t.value}' no pertenece al lenguaje definido.`, 'Elimina ese carácter o reemplázalo por un operador válido.'));
    });

    lineTokens.filter(t => t.type === 'string' && t.closed === false).forEach(() => {
      issues.push(issue('Sintaxis', lineNumber, 'Falta cerrar una cadena de texto con comillas dobles.', 'Ejemplo válido: texto nombre = "Gabriel";'));
    });

    lineTokens.filter(t => t.type === 'number' && t.malformed).forEach(t => {
      issues.push(issue('Sintaxis', lineNumber, `El número '${t.value}' tiene más de un punto decimal.`, 'Ejemplo válido: 4.5'));
    });

    while (lineTokens[0]?.value === '}') {
      openedBlocks--;
      if (openedBlocks < 0) {
        issues.push(issue('Sintaxis', lineNumber, 'Hay una llave de cierre } sin una llave de apertura {.', 'Revisa los bloques si (...) { ... }.'));
        openedBlocks = 0;
      }
      if (scopes.length > 1) scopes.pop();
      lineTokens.shift();
      if (lineTokens.length === 0) break;
    }
    if (lineTokens.length === 0) continue;

    const currentScope = () => scopes[scopes.length - 1];
    const text = lineTokens.map(t => t.value).join(' ');

    const requireSemicolon = (kind) => {
      if (!endsWithSemicolon(lineTokens)) {
        issues.push(issue('Sintaxis', lineNumber, `Falta ';' al final de la ${kind}.`, `Agrega punto y coma: ${text};`));
        return false;
      }
      return true;
    };

    const declare = () => {
      requireSemicolon('declaración');
      const declaredType = lineTokens[0].value;
      const nameToken = lineTokens[1];

      if (!nameToken || nameToken.type !== 'identifier') {
        issues.push(issue('Sintaxis', lineNumber, `Después del tipo '${declaredType}' debe aparecer el nombre de la variable.`, `Ejemplo: ${declaredType} edad = 20;`));
        return;
      }

      const eqIndex = lineTokens.findIndex(t => t.value === '=');
      const contentTokens = stripTrailingSemicolon(lineTokens);
      const hasExtraValueWithoutEquals = eqIndex < 0 && contentTokens.length > 2;

      if (findInExactScope(symbols, nameToken.value, currentScope())) {
        issues.push(issue('Semántico', lineNumber, `La variable '${nameToken.value}' ya fue declarada en el ámbito '${currentScope()}'.`, 'Cambia el nombre de la variable o elimina la declaración repetida.'));
      }

      let initialValue = 'sin inicializar';
      let exprType = null;

      if (hasExtraValueWithoutEquals) {
        const possibleValue = contentTokens.slice(2).map(t => t.value).join(' ');
        issues.push(issue('Sintaxis', lineNumber, `No se pudo asociar '${nameToken.value}' con '${possibleValue}' porque falta el operador '='.`, `Escríbelo así: ${declaredType} ${nameToken.value} = ${possibleValue};`));
        const result = evaluateExpression(contentTokens.slice(2), symbols, scopes, issues, lineNumber);
        exprType = result.type;
        initialValue = result.text;
      } else if (eqIndex >= 0) {
        const exprTokens = expressionAfterEquals(lineTokens, eqIndex);
        const result = evaluateExpression(exprTokens, symbols, scopes, issues, lineNumber);
        exprType = result.type;
        initialValue = result.text;
      }

      if (eqIndex >= 0 || hasExtraValueWithoutEquals) {
        const assignCheck = assignmentProblem(declaredType, exprType);
        if (assignCheck) {
          issues.push(issue('Semántico', lineNumber, `No se puede asignar una expresión de tipo '${exprType}' a la variable '${nameToken.value}' de tipo '${declaredType}'.`, assignCheck));
        }
        intermediate.push(`DECLARAR ${nameToken.value} : ${declaredType}`);
        intermediate.push(`${nameToken.value} = ${initialValue}`);
      } else {
        intermediate.push(`DECLARAR ${nameToken.value} : ${declaredType}`);
      }

      if (!findInExactScope(symbols, nameToken.value, currentScope())) {
        symbols.push({
          name: nameToken.value,
          type: declaredType,
          scope: currentScope(),
          line: lineNumber,
          value: initialValue
        });
      }

      steps.push(`Línea ${lineNumber}: se revisa una declaración. Variable: '${nameToken.value}'. Tipo declarado: '${declaredType}'.${exprType ? ` Tipo detectado en el valor: '${exprType}'.` : ''}`);
    };

    const assign = () => {
      requireSemicolon('asignación');
      const name = lineTokens[0].value;
      const symbol = findSymbol(symbols, name, scopes);
      if (!symbol) {
        issues.push(undeclaredIssue(name, lineNumber, symbols, scopes, 'se usa como destino de una asignación'));
      }
      const eqIndex = lineTokens.findIndex(t => t.value === '=');
      const exprTokens = expressionAfterEquals(lineTokens, eqIndex);
      const result = evaluateExpression(exprTokens, symbols, scopes, issues, lineNumber);
      const targetType = symbol?.type ?? suggestedTypeFor(name, symbols, scopes);
      const assignCheck = assignmentProblem(targetType, result.type);

      if (symbol && assignCheck) {
        issues.push(issue('Semántico', lineNumber, `No se puede asignar una expresión de tipo '${result.type}' a '${name}', porque la variable es de tipo '${symbol.type}'.`, assignCheck));
      }
      if (symbol) symbol.value = result.text;
      intermediate.push(`${name} = ${result.text}`);
      steps.push(`Línea ${lineNumber}: se valida una asignación. Variable destino: '${name}'. Tipo esperado: '${symbol?.type ?? 'desconocido'}'. Tipo recibido: '${result.type ?? 'desconocido'}'.`);
    };

    const malformedAssignment = () => {
      requireSemicolon('asignación');
      const name = lineTokens[0].value;
      const contentTokens = stripTrailingSemicolon(lineTokens);
      const possibleValue = contentTokens.slice(1).map(t => t.value).join(' ');
      const symbol = findSymbol(symbols, name, scopes);

      if (!symbol) {
        issues.push(undeclaredIssue(name, lineNumber, symbols, scopes, 'parece ser una variable de asignación'));
      }
      issues.push(issue('Sintaxis', lineNumber, `No se pudo asociar '${name}' con '${possibleValue}' porque falta el operador '='.`, `Escríbelo así: ${name} = ${possibleValue};`));

      if (possibleValue) {
        const result = evaluateExpression(contentTokens.slice(1), symbols, scopes, issues, lineNumber);
        if (symbol) {
          const assignCheck = assignmentProblem(symbol.type, result.type);
          if (assignCheck) issues.push(issue('Semántico', lineNumber, `Aunque se agregue '=', el valor sería de tipo '${result.type}' y '${name}' es de tipo '${symbol.type}'.`, assignCheck));
        }
      }
      steps.push(`Línea ${lineNumber}: se detecta una asignación mal escrita. Falta el operador '=' para unir la variable con el valor.`);
    };

    const printStatement = () => {
      requireSemicolon('instrucción imprimir');
      const open = lineTokens.findIndex(t => t.value === '(');
      const close = lastIndexOfValue(lineTokens, ')');

      if (open < 0) {
        issues.push(issue('Sintaxis', lineNumber, "Falta el paréntesis de apertura '(' en la instrucción imprimir.", 'Forma correcta: imprimir(expresión);'));
        return;
      }
      if (close < 0 || close <= open) {
        issues.push(issue('Sintaxis', lineNumber, "Falta el paréntesis de cierre ')' en la instrucción imprimir.", 'Forma correcta: imprimir(expresión);'));
        const partial = stripTrailingSemicolon(lineTokens.slice(open + 1));
        if (partial.length) evaluateExpression(partial, symbols, scopes, issues, lineNumber);
        return;
      }

      const exprTokens = lineTokens.slice(open + 1, close);
      const result = evaluateExpression(exprTokens, symbols, scopes, issues, lineNumber);
      intermediate.push(`IMPRIMIR ${result.text}`);
      steps.push(`Línea ${lineNumber}: se valida la expresión enviada a imprimir. Tipo detectado: '${result.type ?? 'desconocido'}'.`);
    };

    const ifStatement = () => {
      const open = lineTokens.findIndex(t => t.value === '(');
      const close = lastIndexOfValue(lineTokens, ')');
      if (open < 0) {
        issues.push(issue('Sintaxis', lineNumber, "Falta el paréntesis de apertura '(' después de 'si'.", 'Forma correcta: si (condición) {'));
        return;
      }
      if (close < 0 || close <= open) {
        issues.push(issue('Sintaxis', lineNumber, "Falta el paréntesis de cierre ')' en la condición del si.", 'Forma correcta: si (condición) {'));
        return;
      }
      if (!lineTokens.some(t => t.value === '{')) {
        issues.push(issue('Sintaxis', lineNumber, "Falta la llave de apertura '{' para iniciar el bloque del si.", 'Forma correcta: si (condición) {'));
      }

      const exprTokens = lineTokens.slice(open + 1, close);
      const result = evaluateExpression(exprTokens, symbols, scopes, issues, lineNumber);
      if (result.type && result.type !== 'logico') {
        issues.push(issue('Semántico', lineNumber, `La condición de 'si' debe ser de tipo 'logico', pero se recibió '${result.type}'.`, 'Usa una comparación, por ejemplo: si (edad >= 18) {'));
      }
      intermediate.push(`SI ${result.text} ENTONCES`);
      steps.push(`Línea ${lineNumber}: se revisa la condición del 'si'. Debe ser lógica; el tipo detectado fue '${result.type ?? 'desconocido'}'.`);

      if (lineTokens.some(t => t.value === '{')) {
        blockCounter++;
        openedBlocks++;
        scopes.push(`bloque_${blockCounter}`);
      }
    };

    const elseStatement = () => {
      if (!lineTokens.some(t => t.value === '{')) {
        issues.push(issue('Sintaxis', lineNumber, "Falta la llave de apertura '{' para iniciar el bloque del sino.", 'Forma correcta: sino {'));
      }
      intermediate.push('SINO');
      if (lineTokens.some(t => t.value === '{')) {
        blockCounter++;
        openedBlocks++;
        scopes.push(`bloque_${blockCounter}`);
      }
    };

    if (TYPE_KEYWORDS.has(lineTokens[0].value)) {
      declare();
    } else if (lineTokens[0].type === 'identifier' && lineTokens.some(t => t.value === '=')) {
      assign();
    } else if (lineTokens[0].type === 'identifier' && lineTokens.length > 1) {
      malformedAssignment();
    } else if (lineTokens[0].value === 'imprimir') {
      printStatement();
    } else if (lineTokens[0].value === 'si') {
      ifStatement();
    } else if (lineTokens[0].value === 'sino') {
      elseStatement();
    } else if (lineTokens.some(t => t.value === '{')) {
      blockCounter++;
      openedBlocks++;
      scopes.push(`bloque_${blockCounter}`);
    } else {
      issues.push(issue('Sintaxis', lineNumber, `No se reconoció la instrucción: ${text}`, 'Usa una declaración, asignación, imprimir(...) o si (...).'));
    }
  }

  if (openedBlocks > 0) {
    issues.push(issue('Sintaxis', lines.length, `Falta cerrar ${openedBlocks} bloque(s) con '}'.`, 'Cada bloque que abre con { debe cerrar con }.'));
  }

  if (steps.length === 0) {
    steps.push('No hay instrucciones para analizar. Escribe un programa usando declaraciones, asignaciones, imprimir o si.');
  }

  return { tokens: allTokens, symbols, errors: issues, intermediate, steps, isEmpty };
}

// Crea un objeto de error con tipo, linea, mensaje y sugerencia.
function issue(kind, line, message, help = '', severity = 'Media') {
  return { kind, type: kind, line, message, help, severity };
}

// Genera un error especializado cuando se usa una variable no declarada.
function undeclaredIssue(name, lineNumber, symbols, scopes, context) {
  const suggestion = findSimilarSymbol(symbols, name, scopes);
  const help = suggestion
    ? `¿Quisiste decir '${suggestion.name}'? Esa variable existe como tipo '${suggestion.type}'. Recuerda que las mayúsculas, minúsculas y letras cambiadas cuentan.`
    : 'Declara la variable antes de usarla. Ejemplo: entero edad = 20;';
  const extra = suggestion ? ` Se encontró una variable parecida: '${suggestion.name}'.` : '';
  return issue('Semántico', lineNumber, `La variable '${name}' ${context}, pero no fue declarada.${extra}`, help);
}

// Busca un simbolo en un ambito exacto.
function findInExactScope(symbols, name, scope) {
  return symbols.find(s => s.name === name && s.scope === scope);
}

// Busca un simbolo visible desde el ambito actual.
function findSymbol(symbols, name, scopes) {
  for (let i = scopes.length - 1; i >= 0; i--) {
    const found = symbols.find(s => s.name === name && s.scope === scopes[i]);
    if (found) return found;
  }
  return null;
}

// Devuelve los simbolos disponibles para una linea y ambito dados.
function visibleSymbols(symbols, scopes) {
  return symbols.filter(s => scopes.includes(s.scope));
}

// Busca nombres parecidos para sugerir correcciones de variables mal escritas.
function findSimilarSymbol(symbols, name, scopes) {
  const candidates = visibleSymbols(symbols, scopes);
  const lowerMatch = candidates.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (lowerMatch) return lowerMatch;
  return candidates.find(s => levenshtein(s.name.toLowerCase(), name.toLowerCase()) <= 2) ?? null;
}

// Intenta inferir el tipo de una expresion textual.
function suggestedTypeFor(name, symbols, scopes) {
  return findSimilarSymbol(symbols, name, scopes)?.type ?? null;
}

// Distancia de Levenshtein: mide que tan parecidas son dos palabras.
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function lastIndexOfValue(tokens, value) {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].value === value) return i;
  }
  return -1;
}

function endsWithSemicolon(tokens) {
  return tokens[tokens.length - 1]?.value === ';';
}

function stripTrailingSemicolon(tokens) {
  return endsWithSemicolon(tokens) ? tokens.slice(0, -1) : tokens.slice();
}

// Extrae la expresion que aparece despues del signo '='.
function expressionAfterEquals(tokens, eqIndex) {
  if (eqIndex < 0) return [];
  return stripTrailingSemicolon(tokens.slice(eqIndex + 1));
}

function isNumeric(type) {
  return type === 'entero' || type === 'decimal';
}

function promoteNumeric(left, right, operator) {
  if (operator === '/') return 'decimal';
  return left === 'decimal' || right === 'decimal' ? 'decimal' : 'entero';
}

// Verifica si un valor puede asignarse a una variable de cierto tipo.
function assignmentProblem(target, source) {
  if (!target || !source) return '';
  if (target === source) return '';
  if (target === 'decimal' && source === 'entero') return '';
  if (target === 'entero' && source === 'decimal') return 'No se permite convertir decimal a entero de forma implícita porque se perderían decimales.';
  if (isNumeric(target) && source === 'texto') return 'Un texto no se puede guardar como número. Usa una variable de tipo texto o cambia la expresión.';
  if (target === 'logico' && source !== 'logico') return 'Una variable lógica solo puede recibir verdadero, falso o una comparación como edad >= 18.';
  return `Los tipos '${target}' y '${source}' no son compatibles.`;
}

// Valida si dos tipos pueden compararse entre si.
function areComparable(left, right) {
  return left === right || (isNumeric(left) && isNumeric(right));
}

// Evalua una expresion del minilenguaje y devuelve su tipo inferido.
function evaluateExpression(tokens, symbols, scopes, issues, lineNumber) {
  let index = 0;

  function peek() { return tokens[index]; }
  function consume(value = null) {
    const token = tokens[index];
    if (!token) return null;
    if (value && token.value !== value) return null;
    index++;
    return token;
  }

  function result(type, text) { return { type, text }; }

  function parsePrimary() {
    const token = peek();
    if (!token) {
      issues.push(issue('Sintaxis', lineNumber, 'La expresión está incompleta o vacía.', 'Después de = debe ir un valor o una expresión. Ejemplo: edad = 20;'));
      return result(null, '<?>');
    }
    if (token.value === '(') {
      consume('(');
      const expr = parseOr();
      if (!consume(')')) issues.push(issue('Sintaxis', lineNumber, 'Falta cerrar un paréntesis en la expresión.', 'Agrega ) para cerrar la agrupación.'));
      return result(expr.type, `(${expr.text})`);
    }
    if (token.type === 'number') {
      consume();
      return result(token.value.includes('.') ? 'decimal' : 'entero', token.value);
    }
    if (token.type === 'string') {
      consume();
      return result('texto', token.value);
    }
    if (token.value === 'verdadero' || token.value === 'falso') {
      consume();
      return result('logico', token.value);
    }
    if (token.type === 'identifier') {
      consume();
      const symbol = findSymbol(symbols, token.value, scopes);
      if (!symbol) {
        const suggestion = findSimilarSymbol(symbols, token.value, scopes);
        issues.push(undeclaredIssue(token.value, lineNumber, symbols, scopes, 'se usa en una expresión'));
        return result(suggestion?.type ?? null, token.value);
      }
      return result(symbol.type, token.value);
    }
    issues.push(issue('Sintaxis', lineNumber, `Token inesperado en la expresión: '${token.value}'.`, 'Revisa si falta un valor, un operador o un paréntesis.'));
    consume();
    return result(null, token.value);
  }

  function parseUnary() {
    const token = peek();
    if (token?.value === '!') {
      consume('!');
      const expr = parseUnary();
      if (expr.type && expr.type !== 'logico') {
        issues.push(issue('Semántico', lineNumber, `El operador '!' requiere un valor logico, pero recibió '${expr.type}'.`, 'Usa ! solo con variables lógicas o condiciones.'));
      }
      return result('logico', `!${expr.text}`);
    }
    if (token?.value === '-') {
      consume('-');
      const expr = parseUnary();
      if (expr.type && !isNumeric(expr.type)) {
        issues.push(issue('Semántico', lineNumber, `El signo negativo solo se puede aplicar a números, pero recibió '${expr.type}'.`, 'Ejemplo válido: edad = -1;'));
      }
      return result(expr.type, `-${expr.text}`);
    }
    return parsePrimary();
  }

  function parseFactor() {
    let left = parseUnary();
    while (['*', '/', '%'].includes(peek()?.value)) {
      const operator = consume().value;
      const right = parseUnary();
      if (left.type && right.type && (!isNumeric(left.type) || !isNumeric(right.type))) {
        issues.push(issue('Semántico', lineNumber, `El operador '${operator}' solo acepta números. Recibió '${left.type}' y '${right.type}'.`, 'Cambia la expresión para operar enteros o decimales.'));
        left = result(null, `${left.text} ${operator} ${right.text}`);
      } else {
        left = result(left.type && right.type ? promoteNumeric(left.type, right.type, operator) : null, `${left.text} ${operator} ${right.text}`);
      }
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    while (['+', '-'].includes(peek()?.value)) {
      const operator = consume().value;
      const right = parseFactor();
      if (operator === '+' && left.type === 'texto' && right.type === 'texto') {
        left = result('texto', `${left.text} + ${right.text}`);
      } else if (left.type && right.type && isNumeric(left.type) && isNumeric(right.type)) {
        left = result(promoteNumeric(left.type, right.type, operator), `${left.text} ${operator} ${right.text}`);
      } else {
        issues.push(issue('Semántico', lineNumber, `El operador '${operator}' no es compatible con '${left.type ?? 'desconocido'}' y '${right.type ?? 'desconocido'}'.`, 'Para sumar o restar usa números. Para concatenar texto, ambos lados deben ser texto.'));
        left = result(null, `${left.text} ${operator} ${right.text}`);
      }
    }
    return left;
  }

  function parseComparison() {
    let left = parseTerm();
    while (['<', '>', '<=', '>='].includes(peek()?.value)) {
      const operator = consume().value;
      const right = parseTerm();
      if (left.type && right.type && (!isNumeric(left.type) || !isNumeric(right.type))) {
        issues.push(issue('Semántico', lineNumber, `El operador '${operator}' solo compara números. Recibió '${left.type}' y '${right.type}'.`, 'Ejemplo válido: edad >= 18.'));
      }
      left = result('logico', `${left.text} ${operator} ${right.text}`);
    }
    return left;
  }

  function parseEquality() {
    let left = parseComparison();
    while (['==', '!='].includes(peek()?.value)) {
      const operator = consume().value;
      const right = parseComparison();
      if (left.type && right.type && !areComparable(left.type, right.type)) {
        issues.push(issue('Semántico', lineNumber, `No se puede comparar '${left.type}' con '${right.type}' usando '${operator}'.`, 'Compara valores del mismo tipo o números entre sí.'));
      }
      left = result('logico', `${left.text} ${operator} ${right.text}`);
    }
    return left;
  }

  function parseAnd() {
    let left = parseEquality();
    while (peek()?.value === '&&') {
      consume('&&');
      const right = parseEquality();
      if (left.type && left.type !== 'logico') issues.push(issue('Semántico', lineNumber, `El lado izquierdo de '&&' debe ser logico, pero es '${left.type}'.`, 'Usa condiciones lógicas en ambos lados de &&.'));
      if (right.type && right.type !== 'logico') issues.push(issue('Semántico', lineNumber, `El lado derecho de '&&' debe ser logico, pero es '${right.type}'.`, 'Usa condiciones lógicas en ambos lados de &&.'));
      left = result('logico', `${left.text} && ${right.text}`);
    }
    return left;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek()?.value === '||') {
      consume('||');
      const right = parseAnd();
      if (left.type && left.type !== 'logico') issues.push(issue('Semántico', lineNumber, `El lado izquierdo de '||' debe ser logico, pero es '${left.type}'.`, 'Usa condiciones lógicas en ambos lados de ||.'));
      if (right.type && right.type !== 'logico') issues.push(issue('Semántico', lineNumber, `El lado derecho de '||' debe ser logico, pero es '${right.type}'.`, 'Usa condiciones lógicas en ambos lados de ||.'));
      left = result('logico', `${left.text} || ${right.text}`);
    }
    return left;
  }

  const parsed = parseOr();
  if (index < tokens.length) {
    issues.push(issue('Sintaxis', lineNumber, `Hay tokens sobrantes en la expresión: '${tokens.slice(index).map(t => t.value).join(' ')}'.`, 'Revisa si falta un operador o si hay símbolos de más.'));
  }
  return parsed;
}

// Actualiza la interfaz con todos los resultados del analisis.
function renderAnalysis(result) {
  if (result.isEmpty) {
    verdict.className = 'verdict';
    verdict.textContent = 'Escribe código o carga un ejemplo para comenzar el análisis.';
  } else {
    const ok = result.errors.length === 0;
    verdict.className = `verdict ${ok ? 'ok' : 'bad'}`;
    verdict.textContent = ok
      ? '✅ Sentencia correcta. El programa pasó el análisis sintáctico y semántico sin problemas.'
      : `❌ Se encontraron ${result.errors.length} error(es) de sintaxis o semántica.`;
  }

  tokenCount.textContent = result.tokens.length;
  symbolCount.textContent = result.symbols.length;
  errorCount.textContent = result.errors.length;

  panels.errors.innerHTML = renderErrors(result.errors, result.isEmpty);
  panels.symbols.innerHTML = renderSymbols(result.symbols);
  panels.tokens.innerHTML = renderTokens(result.tokens);
  panels.intermediate.innerHTML = renderIntermediate(result.intermediate, result.errors.length);
  panels.steps.innerHTML = renderSteps(result.steps);

  if (result.errors.length > 0) {
    document.querySelector('.tab[data-tab="errors"]')?.click();
  } else if (!result.isEmpty) {
    document.querySelector('.tab[data-tab="tokens"]')?.click();
  }
}

// Renderiza la lista de errores detectados.
function renderErrors(errors, isEmpty) {
  if (isEmpty) return `<div class="empty">El editor está vacío. Escribe código o usa uno de los ejemplos para iniciar el análisis.</div>`;
  if (!errors.length) return `<div class="empty">No se detectaron errores. El programa es coherente según las reglas del lenguaje integrado.</div>`;
  return `<div class="error-list">${errors.map(e => `<div class="error-item"><div class="error-title"><span class="error-kind">${htmlEscape(e.kind)}</span><strong>Línea ${e.line}:</strong><span class="badge">Severidad: ${htmlEscape(e.severity ?? 'Media')}</span></div><div>${htmlEscape(e.message)}</div>${e.help ? `<small>${htmlEscape(e.help)}</small>` : ''}</div>`).join('')}</div>`;
}

// Renderiza la tabla de simbolos.
function renderSymbols(symbols) {
  if (!symbols.length) return `<div class="empty">Todavía no hay símbolos registrados. Declara variables para llenar esta tabla.</div>`;
  return `<table class="table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Ámbito</th><th>Línea</th><th>Valor / expresión</th></tr></thead><tbody>${symbols.map(s => `<tr><td><strong>${htmlEscape(s.name)}</strong></td><td><span class="badge">${htmlEscape(s.type)}</span></td><td>${htmlEscape(s.scope)}</td><td>${s.line}</td><td>${htmlEscape(s.value)}</td></tr>`).join('')}</tbody></table>`;
}

// Renderiza la tabla de tokens.
function renderTokens(tokens) {
  if (!tokens.length) return `<div class="empty">No hay tokens todavía. Escribe código en el editor.</div>`;
  return `<table class="table"><thead><tr><th>Línea</th><th>Lexema</th><th>Categoría</th></tr></thead><tbody>${tokens.map(t => `<tr><td>${t.line}</td><td><code>${htmlEscape(t.value)}</code></td><td>${htmlEscape(TOKEN_LABELS[t.type] ?? t.type)}</td></tr>`).join('')}</tbody></table>`;
}

// Renderiza el codigo intermedio generado.
function renderIntermediate(lines, errorTotal) {
  if (!lines.length) return `<div class="empty">Todavía no hay código intermedio para mostrar.</div>`;
  const warning = errorTotal > 0 ? `// Advertencia: esta representación se muestra aunque el programa tenga errores.\n` : ''; 
  return `<pre class="code-box"><code>${htmlEscape(warning + lines.join('\n'))}</code></pre>`;
}

// Renderiza la explicacion paso a paso del analisis.
function renderSteps(steps) {
  return `<div class="steps">${steps.map(step => `<div class="step">${htmlEscape(step)}</div>`).join('')}</div>`;
}

renderAnalysis(analyze(codeInput.value));
