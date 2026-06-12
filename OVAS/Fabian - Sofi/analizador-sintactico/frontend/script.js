if (typeof d3 === 'undefined') {
    console.warn("D3 no se cargó. Utilizando objeto mock.");
    const mockSelection = {
        classed: function() { return this; },
        selectAll: function() { return this; },
        remove: function() { return this; },
        append: function() { return this; },
        attr: function() { return this; },
        style: function() { return this; },
        text: function() { return this; },
        transition: function() { return this; },
        duration: function() { return this; },
        call: function() { return this; },
        on: function() { return this; },
        data: function() { return this; },
        enter: function() { return this; },
        node: function() { return {}; },
        empty: function() { return true; }
    };
    
    window.d3 = {
        select: () => mockSelection,
        selectAll: () => mockSelection,
        zoom: () => ({
            scaleExtent: function() { return this; },
            on: function() { return this; },
            scaleBy: () => {},
            transform: () => {}
        }),
        zoomIdentity: {},
        hierarchy: () => ({
            descendants: () => [],
            links: () => []
        }),
        tree: () => ({
            size: () => ({
                separation: () => ({})
            })
        }),
        linkVertical: () => () => "",
        linkHorizontal: () => () => "",
        zoomTransform: () => ({ k: 1 })
    };
}

let editor = null;
let currentAST = null;
let currentTokens = [];
let currentSymbols = [];
let currentErrors = [];
let currentTrace = [];
let currentTAC = [];
let analysisHistory = [];

let tracePlayer = {
    currentIndex: -1,
    isPlaying: false,
    intervalId: null,
    speed: 800,
};

let currentLayout = 'vertical';
let d3Zoom = null;
let svgElement = null;
let svgGroup = null;
let treeRoot = null;
let collapsedNodeIds = new Set();
let hoverDecorations = [];

/** URL base del backend FastAPI (vacío = same-origin /api/...) */
const API_CONFIG = {
    baseUrl: '',

    init() {
        const saved = localStorage.getItem('url-sintactico');
        if (saved && saved.trim()) {
            this.baseUrl = saved.trim().replace(/\/$/, '');
            return;
        }
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            this.baseUrl = 'http://localhost:8001';
        }
    },

    setBaseUrl(url) {
        if (url && typeof url === 'string' && url.trim()) {
            this.baseUrl = url.trim().replace(/\/$/, '');
        }
    },

    resolve(path) {
        const normalized = path.startsWith('/') ? path : `/${path}`;
        if (normalized === '/health') {
            return this.baseUrl ? `${this.baseUrl}${normalized}` : normalized;
        }
        const apiPath = normalized.startsWith('/api') ? normalized : `/api${normalized}`;
        if (this.baseUrl) {
            return `${this.baseUrl}${apiPath}`;
        }
        return apiPath;
    },

    isLocalDev() {
        const base = (this.baseUrl || '').toLowerCase();
        if (base.includes('localhost') || base.includes('127.0.0.1')) {
            return true;
        }
        const host = window.location.hostname;
        return !this.baseUrl && (host === 'localhost' || host === '127.0.0.1');
    }
};

let apiConnectionState = 'checking';

function setupSynEmbeddedMode() {
    if (window.self !== window.top) {
        document.documentElement.classList.add('syn-embedded');
        document.documentElement.setAttribute('data-ova-embedded', 'true');
    }
}

function getUsbTheme() {
    return document.documentElement.classList.contains('usb-ova-light') ? 'light' : 'dark';
}

function syncD3ThemeClass() {
    const container = document.getElementById('tree-container');
    if (!container) return;
    container.classList.toggle('syn-d3-light', getUsbTheme() === 'light');
}

function applyMonacoEditorTheme() {
    if (!editor || editor.isFallback || typeof monaco === 'undefined') return;
    monaco.editor.setTheme(getUsbTheme() === 'light' ? 'editorLightTheme' : 'editorDarkTheme');
}

function setupUsbThemeIntegration() {
    if (typeof USB_OVA_THEME !== 'undefined') {
        USB_OVA_THEME.init();
    }
    window.addEventListener('usb-ova-theme-changed', () => {
        applyMonacoEditorTheme();
        syncD3ThemeClass();
    });
    syncD3ThemeClass();
}

function setupPortalMessageListener() {
    window.addEventListener('message', (event) => {
        if (event.data?.type !== 'USB_PORTAL_CONFIG') return;
        const url = event.data.config?.apiUrls?.sintactico;
        if (url) {
            API_CONFIG.setBaseUrl(url);
            updateConnectionStatus();
        }
    });
}

async function probeApiConnection() {
    try {
        const response = await fetch(API_CONFIG.resolve('/health'), {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data?.status === 'ok';
    } catch {
        return false;
    }
}

async function updateConnectionStatus() {
    const badge = document.getElementById('api-status-badge');
    const dot = document.getElementById('api-status-dot');
    const text = document.getElementById('api-status-text');
    if (!badge || !dot || !text) return;

    badge.className = 'ova-badge-api syn-api-badge';
    dot.textContent = '⏳';
    text.textContent = 'Verificando conexión...';

    const online = await probeApiConnection();

    badge.classList.remove('status-remote', 'status-local', 'status-offline');

    if (online) {
        apiConnectionState = API_CONFIG.isLocalDev() ? 'local' : 'remote';
        if (apiConnectionState === 'local') {
            badge.classList.add('status-local');
            dot.textContent = '🟡';
            text.textContent = 'Desarrollo local';
        } else {
            badge.classList.add('status-remote');
            dot.textContent = '🟢';
            text.textContent = 'FastAPI remoto';
        }
    } else {
        apiConnectionState = 'offline';
        badge.classList.add('status-offline');
        dot.textContent = '🔴';
        text.textContent = 'Sin conexión — configure API en portal USB';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupSynEmbeddedMode();
    setupUsbThemeIntegration();
    API_CONFIG.init();
    setupPortalMessageListener();
    loadExamples();
    loadHistory();
    setupEventHandlers();
    loadMonacoEditor();
    await updateConnectionStatus();
}

function loadMonacoEditor() {
    let monacoLoaded = false;

    const fallbackTimer = setTimeout(() => {
        if (!monacoLoaded) {
            console.warn("Monaco Editor CDN timeout. Cargando editor de texto alternativo.");
            loadFallbackEditor();
        }
    }, 4000);

    try {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            monacoLoaded = true;
            clearTimeout(fallbackTimer);

            if (document.getElementById('fallback-textarea')) return;

            monaco.languages.register({ id: 'compiladoresLang' });
            monaco.languages.setMonarchTokensProvider('compiladoresLang', {
                tokenizer: {
                    root: [
                        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
                        [/\d+(\.\d+)?/, 'number'],
                        [/[=+\-*/();]/, 'operator'],
                        [/\s+/, 'white']
                    ]
                }
            });

            monaco.editor.defineTheme('editorDarkTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'identifier', foreground: 'e2e8f0' },
                    { token: 'number', foreground: '2dd4bf' },
                    { token: 'operator', foreground: 'f59e0b', fontStyle: 'bold' },
                ],
                colors: {
                    'editor.background': '#0a0e1c',
                    'editor.foreground': '#cbd5e1',
                    'editor.lineHighlightBackground': '#1e293b50',
                    'editorLineNumber.foreground': '#475569',
                    'editorLineNumber.activeForeground': '#10b981',
                    'editor.selectionBackground': '#10b98130',
                }
            });

            monaco.editor.defineTheme('editorLightTheme', {
                base: 'vs',
                inherit: true,
                rules: [
                    { token: 'identifier', foreground: '0f172a' },
                    { token: 'number', foreground: '0d9488' },
                    { token: 'operator', foreground: 'd97706', fontStyle: 'bold' },
                ],
                colors: {
                    'editor.background': '#f8fafc',
                    'editor.foreground': '#334155',
                    'editor.lineHighlightBackground': '#e2e8f040',
                    'editorLineNumber.foreground': '#94a3b8',
                    'editorLineNumber.activeForeground': '#0284c7',
                    'editor.selectionBackground': '#0284c730',
                }
            });

            const monacoContainer = document.getElementById('monaco-container');
            monacoContainer.innerHTML = '';
            monacoContainer.className = 'flex-1 w-full bg-[#0a0e1c] min-h-[120px]';

            const initialMonacoTheme = getUsbTheme() === 'light' ? 'editorLightTheme' : 'editorDarkTheme';

            editor = monaco.editor.create(monacoContainer, {
                value: "x = 10;\ny = 5 + 3 * 2;\nresultado = (x + y) * 2;\n",
                language: 'compiladoresLang',
                theme: initialMonacoTheme,
                automaticLayout: true,
                fontSize: 14,
                fontFamily: 'JetBrains Mono',
                minimap: { enabled: false },
                lineNumbers: 'on',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 12 }
            });

            let debounceTimer;
            editor.onDidChangeModelContent(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    runAnalysis(false);
                }, 1000);
            });

            runAnalysis(true);
        });
    } catch (e) {
        console.error("Error cargando Monaco via require.js:", e);
        if (!monacoLoaded) {
            clearTimeout(fallbackTimer);
            loadFallbackEditor();
        }
    }
}

function loadFallbackEditor() {
    const container = document.getElementById('monaco-container');
    container.innerHTML = '';
    container.className = 'flex-1 w-full bg-[#0a0e1c] min-h-[120px]';

    const textarea = document.createElement('textarea');
    textarea.id = 'fallback-textarea';
    textarea.className = 'w-full h-full p-4 bg-[#0a0e1c] text-emerald-400 font-mono text-sm border-0 focus:ring-0 resize-none outline-none rounded-b-2xl';
    textarea.placeholder = 'Escribe tu código de compiladores aquí...';
    textarea.value = "x = 10;\ny = 5 + 3 * 2;\nresultado = (x + y) * 2;\n";
    container.appendChild(textarea);

    editor = {
        isFallback: true,
        getValue: () => textarea.value,
        setValue: (val) => { textarea.value = val; },
        onDidChangeModelContent: (callback) => {
            textarea.addEventListener('input', callback);
        },
        setSelection: () => {},
        revealRangeInCenter: () => {},
        deltaDecorations: () => []
    };

    let debounceTimer;
    textarea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            runAnalysis(false);
        }, 1000);
    });

    showToast("Monaco fuera de línea. Editor alternativo cargado.", "warning");
    runAnalysis(true);
}

function setupEventHandlers() {
    document.getElementById('btn-analyze').addEventListener('click', () => runAnalysis(true));

    document.getElementById('btn-clear').addEventListener('click', () => {
        if (!editor) {
            showToast("El editor de código no se ha cargado aún.", "warning");
            return;
        }
        editor.setValue('');
        clearAnalysisResults();
        showToast("Editor limpio", "info");
    });

    document.getElementById('example-select').addEventListener('change', (e) => {
        const exampleId = e.target.value;
        loadExampleById(exampleId);
    });

    document.getElementById('history-select').addEventListener('change', (e) => {
        const code = e.target.value;
        if (code) {
            if (!editor) {
                showToast("El editor de código no se ha cargado aún.", "warning");
                return;
            }
            editor.setValue(code);
            runAnalysis(true);
        }
    });

    document.getElementById('btn-step-play').addEventListener('click', toggleTracePlay);
    document.getElementById('btn-step-prev').addEventListener('click', stepPrev);
    document.getElementById('btn-step-next').addEventListener('click', stepNext);
    
    const speedSlider = document.getElementById('step-speed');
    speedSlider.addEventListener('input', (e) => {
        tracePlayer.speed = parseInt(e.target.value);
        document.getElementById('speed-label').innerText = `${(tracePlayer.speed / 1000).toFixed(1)}s`;
        if (tracePlayer.isPlaying) {
            pauseTrace();
            playTrace();
        }
    });

    document.getElementById('layout-vertical').addEventListener('click', () => switchTreeLayout('vertical'));
    document.getElementById('layout-horizontal').addEventListener('click', () => switchTreeLayout('horizontal'));
    document.getElementById('layout-radial').addEventListener('click', () => switchTreeLayout('radial'));

    document.getElementById('zoom-in').addEventListener('click', () => {
        if (svgElement && d3Zoom) {
            d3.select(svgElement).transition().duration(300).call(d3Zoom.scaleBy, 1.3);
        }
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        if (svgElement && d3Zoom) {
            d3.select(svgElement).transition().duration(300).call(d3Zoom.scaleBy, 0.7);
        }
    });
    document.getElementById('zoom-reset').addEventListener('click', resetZoom);

    document.getElementById('btn-export-png').addEventListener('click', exportTreePNG);
    document.getElementById('btn-export-pdf').addEventListener('click', generatePDFReport);

    const treeContainer = document.getElementById('tree-container');
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            if (currentAST) {
                buildASTTree(currentAST);
            }
        });
        resizeObserver.observe(treeContainer);
    } else {
        window.addEventListener('resize', () => {
            if (currentAST) {
                buildASTTree(currentAST);
            }
        });
    }
}


function populateExamplesSelect(examples) {
    const select = document.getElementById('example-select');
    if (!select || !Array.isArray(examples)) return;
    examples.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.id;
        opt.innerText = `[${ex.category === 'Válido' ? 'OK' : 'ERR'}] ${ex.name}`;
        opt.dataset.code = ex.code;
        select.appendChild(opt);
    });
}

async function loadExamples() {
    const staticPaths = [
        '../ejemplos/ejemplos.json',
        'ejemplos/ejemplos.json'
    ];

    for (const path of staticPaths) {
        try {
            const response = await fetch(path);
            if (!response.ok) continue;
            const examples = await response.json();
            populateExamplesSelect(examples);
            return;
        } catch (err) {
            console.warn(`Ejemplos no disponibles en ${path}:`, err);
        }
    }

    try {
        const response = await fetch(API_CONFIG.resolve('/examples'));
        if (!response.ok) throw new Error('API examples unavailable');
        const examples = await response.json();
        populateExamplesSelect(examples);
    } catch (err) {
        console.error('Error al cargar ejemplos:', err);
        showToast('No se pudieron cargar los ejemplos.', 'error');
    }
}

function loadExampleById(id) {
    if (!editor) {
        showToast("El editor de código no se ha cargado aún.", "warning");
        return;
    }
    const select = document.getElementById('example-select');
    const option = Array.from(select.options).find(opt => opt.value == id);
    if (option && option.dataset.code) {
        editor.setValue(option.dataset.code);
        runAnalysis(true);
        showToast(`Ejemplo '${option.innerText.substring(2)}' cargado`, "success");
    }
}

function loadHistory() {
    try {
        const stored = localStorage.getItem('compiler_parser_history');
        if (stored) {
            analysisHistory = JSON.parse(stored);
        }
        updateHistorySelect();
    } catch (e) {
        console.error("Error cargando historial de localStorage:", e);
    }
}

function saveToHistory(code) {
    if (!code.trim()) return;
    if (analysisHistory.length > 0 && analysisHistory[0] === code) return;
    
    analysisHistory = [code, ...analysisHistory.filter(c => c !== code)].slice(0, 5);
    localStorage.setItem('compiler_parser_history', JSON.stringify(analysisHistory));
    updateHistorySelect();
}

function updateHistorySelect() {
    const select = document.getElementById('history-select');
    select.innerHTML = '<option value="" disabled selected>Historial reciente</option>';
    analysisHistory.forEach((code, index) => {
        const opt = document.createElement('option');
        opt.value = code;
        const lines = code.trim().split('\n');
        const preview = lines[0].substring(0, 20) + (lines.length > 1 || lines[0].length > 20 ? '...' : '');
        opt.innerText = `#${index + 1}: ${preview}`;
        select.appendChild(opt);
    });
}

async function runAnalysis(showVisualEffects = true) {
    if (!editor) {
        if (showVisualEffects) {
            showToast("Cargando el editor de código. Espera un momento.", "info");
        }
        return;
    }
    const code = editor.getValue();
    if (!code.trim() && showVisualEffects) {
        showToast("Por favor, escribe algo de código primero.", "warning");
        return;
    }

    try {
        const response = await fetch(API_CONFIG.resolve('/analyze'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) throw new Error("Error en servidor");

        await updateConnectionStatus();
        
        const data = await response.json();
        
        currentAST = data.ast;
        currentTokens = data.tokens;
        currentSymbols = data.symbols;
        currentErrors = data.errors;
        currentTrace = data.trace;
        currentTAC = data.tac || [];

        renderTokens(currentTokens);
        renderSymbols(currentSymbols);
        renderErrors(currentErrors);
        renderTAC(currentTAC);
        
        if (currentAST) {
            const treeOverlay = document.getElementById('tree-overlay-msg');
            if (treeOverlay) treeOverlay.style.display = 'none';
            collapsedNodeIds.clear();
            buildASTTree(currentAST);
        } else {
            clearD3Tree();
            const treeOverlay = document.getElementById('tree-overlay-msg');
            if (treeOverlay) {
                treeOverlay.style.display = '';
                treeOverlay.innerText = "Código con errores críticos. No se puede construir el AST.";
            }
        }

        resetTracePlayer();

        if (showVisualEffects) {
            if (currentErrors.length > 0) {
                showToast(`Análisis completado con ${currentErrors.length} error(es)`, "error");
                switchTab('errors');
            } else {
                showToast("¡Análisis completado con éxito!", "success");
                saveToHistory(code);
            }
        }
    } catch (err) {
        console.error("Error analizando código:", err);
        apiConnectionState = 'offline';
        await updateConnectionStatus();
        if (showVisualEffects) {
            showToast("No se pudo conectar con el servicio de análisis.", "error");
        }
    }
}

function clearAnalysisResults() {
    currentAST = null;
    currentTokens = [];
    currentSymbols = [];
    currentErrors = [];
    currentTrace = [];
    currentTAC = [];
    
    renderTokens([]);
    renderSymbols([]);
    renderErrors([]);
    renderTAC([]);
    clearD3Tree();
    resetTracePlayer();
    
    const ov = document.getElementById('tree-overlay-msg');
    if (ov) {
        ov.style.display = '';
        ov.innerText = "El árbol sintáctico aparecerá aquí tras analizar el código.";
    }
}


function renderTokens(tokens) {
    const tbody = document.getElementById('tokens-table-body');
    tbody.innerHTML = '';
    
    if (tokens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500 italic">No se ha analizado ningún código aún.</td></tr>';
        return;
    }

    tokens.forEach((tok, index) => {
        const tr = document.createElement('tr');
        tr.id = `token-row-${index}`;
        tr.className = 'hover:bg-slate-900/60 cursor-pointer transition-colors duration-200';
        tr.onclick = () => highlightTokenInEditor(tok);
        
        tr.innerHTML = `
            <td class="py-2 px-3 text-slate-500 font-bold">${index + 1}</td>
            <td class="py-2 px-3 text-emerald-400 font-semibold">${escapeHtml(tok.value)}</td>
            <td class="py-2 px-3"><span class="px-1.5 py-0.5 rounded text-xxs font-bold ${getTokenBadgeClass(tok.category)}">${tok.category || tok.type}</span></td>
            <td class="py-2 px-3 text-slate-500 text-xxs font-mono">${tok.type}</td>
            <td class="py-2 px-3 text-slate-400 font-mono">${tok.line}:${tok.column}</td>
            <td class="py-2 px-3 text-slate-500 text-xxs font-mono">[${tok.start_idx}, ${tok.end_idx}]</td>
        `;
        tbody.appendChild(tr);
    });
}

function getTokenBadgeClass(category) {
    switch (category) {
        case 'Identificador':
            return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'Literal / Constante':
            return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
        case 'Operador':
            return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'Separador / Delimitador':
            return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        case 'Fin de Archivo':
            return 'bg-slate-900 text-slate-600 border border-slate-700/50';
        case 'Error L\u00e9xico':
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        default:
            return 'bg-slate-800 text-slate-400 border border-slate-700/50';
    }
}

function renderSymbols(symbols) {
    const tbody = document.getElementById('symbols-table-body');
    tbody.innerHTML = '';
    
    if (symbols.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-500 italic">No se han detectado variables.</td></tr>';
        return;
    }

    symbols.forEach(sym => {
        const historyDetails = sym.history.map(h => `Línea ${h.line}: ${h.value}`).join(', ');
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/60 transition-colors duration-200';
        tr.innerHTML = `
            <td class="py-2.5 px-3 text-emerald-400 font-bold">${escapeHtml(sym.name)}</td>
            <td class="py-2.5 px-3 text-slate-400"><span class="px-2 py-0.5 rounded text-xxs font-bold bg-slate-900 border border-cyber-border">${sym.type}</span></td>
            <td class="py-2.5 px-3 text-teal-300 font-semibold font-mono">${sym.value}</td>
            <td class="py-2.5 px-3 text-slate-500 font-mono">L:${sym.line} C:${sym.column}</td>
            <td class="py-2.5 px-3 text-slate-400 text-xxs max-w-[200px] truncate" title="${historyDetails}">${historyDetails}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderErrors(errors) {
    const container = document.getElementById('errors-container');
    const badge = document.getElementById('error-badge');
    container.innerHTML = '';
    
    if (errors.length === 0) {
        badge.classList.add('hidden');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-emerald-500/80">
                <p class="text-sm font-semibold">Sin errores de compilacion</p>
                <p class="text-xs text-slate-500 font-mono mt-1">Escribe codigo y pulsa Analizar para comprobar validez.</p>
            </div>
        `;
        return;
    }

    badge.innerText = errors.length;
    badge.classList.remove('hidden');

    errors.forEach(err => {
        const div = document.createElement('div');
        div.className = 'flex flex-col gap-2 p-4 rounded-xl border border-red-500/20 bg-red-950/10 shadow shadow-red-950/20 hover:border-red-500/40 transition-all duration-300 cursor-pointer';
        div.onclick = () => highlightRangeInEditor(err.line, err.column, err.line, err.column + (err.end_idx - err.start_idx));
        
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-xxs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">${err.type}</span>
                <span class="text-xs font-semibold text-red-200">Error en Línea ${err.line}, Columna ${err.column}</span>
            </div>
            <p class="text-xs font-mono text-slate-300">${escapeHtml(err.message)}</p>
            ${err.suggestion ? `
            <div class="mt-1 pt-1.5 border-t border-red-500/10 flex items-start gap-1 text-xxs font-mono text-amber-400/90">
                <span class="text-amber-500 font-bold">Sugerencia:</span>
                <span>${escapeHtml(err.suggestion)}</span>
            </div>
            ` : ''}
        `;
        container.appendChild(div);
    });
}

function renderTAC(tac) {
    const codeContainer = document.getElementById('tac-code');
    if (!codeContainer) return;
    if (tac.length === 0) {
        codeContainer.innerText = '// No se generó código de tres direcciones (TAC) debido a errores.';
        return;
    }
    codeContainer.innerText = tac.join('\n');
}


const NODE_COLORS = {
    'Program':  { fill: '#1e1b4b', stroke: '#3b82f6' },
    'Assign':   { fill: '#1a103c', stroke: '#8b5cf6' },
    'BinOp':    { fill: '#3c1e10', stroke: '#f59e0b' },
    'Variable': { fill: '#064e3b', stroke: '#10b981' },
    'Number':   { fill: '#0f4c5c', stroke: '#2dd4bf' },
};
const DEFAULT_NODE_COLOR = { fill: '#1e293b', stroke: '#64748b' };

function clearD3Tree() {
    const container = document.getElementById('tree-container');
    Array.from(container.querySelectorAll('svg')).forEach(s => s.remove());
    svgElement = null;
    svgGroup   = null;
    d3Zoom     = null;
    treeRoot   = null;
}

function buildASTTree(astData) {
    clearD3Tree();
    if (typeof d3 === 'undefined') { console.error('[AST] D3 no cargado'); return; }
    if (!astData) { console.warn('[AST] Sin datos'); return; }

    requestAnimationFrame(() => requestAnimationFrame(() => __renderTree(astData)));
}

function __renderTree(astData) {
    const container = document.getElementById('tree-container');

    if (!container.style.minHeight) container.style.minHeight = '260px';

    let W = container.offsetWidth;
    let H = container.offsetHeight;
    if (!W || W < 50) W = container.getBoundingClientRect().width || 800;
    if (!H || H < 50) H = container.getBoundingClientRect().height || 300;
    if (W < 50) W = 800;
    if (H < 50) H = 300;

    console.log(`[AST] Dibujando árbol: ${W}×${H}, nodos raiz: ${astData.type}`);

    Array.from(container.querySelectorAll('svg')).forEach(s => s.remove());

    const svg = d3.select(container)
        .append('svg')
        .attr('width',  W)
        .attr('height', H)
        .style('display', 'block')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('z-index', '1');

    svgElement = svg.node();
    const g = svg.append('g').attr('class', 'tree-root');
    svgGroup = g.node();

    d3Zoom = d3.zoom()
        .scaleExtent([0.05, 6])
        .on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(d3Zoom);

    treeRoot = d3.hierarchy(astData, d =>
        (collapsedNodeIds.has(d.id) || !d.children || d.children.length === 0)
            ? null : d.children
    );

    console.log(`[AST] Jerarquia lista: ${treeRoot.descendants().length} nodos`);
    _renderLayout(g, W, H);
}

function _renderLayout(g, W, H) {
    if (!treeRoot) return;
    g.selectAll('*').remove();

    const R = 12;
    let nodes, links;

    if (currentLayout === 'vertical') {
        d3.tree().nodeSize([65, 70])(treeRoot);
        nodes = treeRoot.descendants();
        links = treeRoot.links();
        nodes.forEach(d => { d.px = d.x; d.py = d.y; });

    } else if (currentLayout === 'horizontal') {
        d3.tree().nodeSize([45, 95])(treeRoot);
        nodes = treeRoot.descendants();
        links = treeRoot.links();
        nodes.forEach(d => { d.px = d.y; d.py = d.x; });

    } else { // radial
        const rad = Math.min(W, H) / 2 - 80;
        d3.tree().size([2 * Math.PI, rad])
          .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)(treeRoot);
        nodes = treeRoot.descendants();
        links = treeRoot.links();
        nodes.forEach(d => {
            d.px = W/2 + (d.depth === 0 ? 0 : d.y * Math.cos(d.x - Math.PI/2));
            d.py = H/2 + (d.depth === 0 ? 0 : d.y * Math.sin(d.x - Math.PI/2));
        });
    }

    nodes.forEach(d => { d.xPosition = d.px; d.yPosition = d.py; });

    g.append('g')
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', '#6366f1')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5)
        .attr('d', d => {
            const {px: sx, py: sy} = d.source;
            const {px: tx, py: ty} = d.target;
            if (currentLayout === 'vertical') {
                const my = (sy + ty) / 2;
                return `M${sx},${sy}C${sx},${my} ${tx},${my} ${tx},${ty}`;
            } else if (currentLayout === 'horizontal') {
                const mx = (sx + tx) / 2;
                return `M${sx},${sy}C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
            }
            return `M${sx},${sy}L${tx},${ty}`;
        });

    const nodeG = g.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', d => `d3-node d3-node-${d.data.type}`)
        .attr('id',    d => `node-${d.data.id}`)
        .attr('transform', d => `translate(${d.px},${d.py})`)
        .style('cursor', 'pointer')
        .on('click',     (e, d) => { e.stopPropagation(); toggleNodeCollapse(d.data); })
        .on('mouseover', (e, d) => { highlightBidirectionalNode(d.data); showTooltip(e, d.data); })
        .on('mouseout',  ()     => { clearBidirectionalHighlights(); hideTooltip(); });

    nodeG.append('circle')
        .attr('r', R)
        .attr('fill',         d => (NODE_COLORS[d.data.type] || DEFAULT_NODE_COLOR).fill)
        .attr('stroke',       d => (NODE_COLORS[d.data.type] || DEFAULT_NODE_COLOR).stroke)
        .attr('stroke-width', 2.5);

    nodeG.append('text')
        .attr('dy', '0.35em')
        .attr('y', d => {
            if (currentLayout === 'horizontal') return 0;
            return d.children ? -(R + 7) : (R + 14);
        })
        .attr('x', d => currentLayout === 'horizontal' ? (d.children ? -(R + 6) : (R + 6)) : 0)
        .attr('text-anchor', d =>
            currentLayout === 'horizontal' ? (d.children ? 'end' : 'start') : 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '11')
        .attr('font-weight', '600')
        .attr('font-family', "'Space Grotesk', sans-serif")
        .attr('stroke', '#05070f')
        .attr('stroke-width', '3')
        .attr('paint-order', 'stroke')
        .attr('pointer-events', 'none')
        .text(d => d.data.label);

    let ox = W/2, oy = H/2, sc = 1.0;
    
    if (currentLayout !== 'radial') {
        const xs = nodes.map(d => d.px);
        const ys = nodes.map(d => d.py);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        const tW = (maxX - minX) || 1;
        const tH = (maxY - minY) || 1;
        
        const marginX = 60;
        const marginY = 40;
        
        sc = Math.min((W - marginX * 2) / tW, (H - marginY * 2) / tH, 1.0);
        
        ox = W/2 - (minX + tW/2) * sc;
        oy = H/2 - (minY + tH/2) * sc;
    }

    d3.select(svgElement).call(
        d3Zoom.transform,
        d3.zoomIdentity.translate(ox, oy).scale(sc)
    );

    const ov = document.getElementById('tree-overlay-msg');
    if (ov) ov.style.display = 'none';
}





function toggleNodeCollapse(nodeData) {
    if (nodeData.type === 'Variable' || nodeData.type === 'Number') return;
    
    if (collapsedNodeIds.has(nodeData.id)) {
        collapsedNodeIds.delete(nodeData.id);
        showToast(`Expandido nodo '${nodeData.label}'`, "info");
    } else {
        collapsedNodeIds.add(nodeData.id);
        showToast(`Colapsado nodo '${nodeData.label}'`, "info");
    }
    buildASTTree(currentAST);
}

function switchTreeLayout(layout) {
    if (currentLayout === layout) return;
    
    document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`layout-${layout}`).classList.add('active');
    currentLayout = layout;
    
    if (currentAST) {
        buildASTTree(currentAST);
    }
}

function resetZoom() {
    if (svgElement && d3Zoom) {
        d3.select(svgElement).transition().duration(400).call(d3Zoom.transform, d3.zoomIdentity);
    }
}


function revealMonacoRange(range) {
    if (!editor || editor.isFallback) return;
    if (typeof editor.revealRangeInCenter === 'function') {
        editor.revealRangeInCenter(range);
    }
}

function highlightBidirectionalNode(nodeData) {
    if (nodeData.start_idx !== undefined && nodeData.end_idx !== undefined) {
        if (editor) {
            if (editor.isFallback) {
                const textarea = document.getElementById('fallback-textarea');
                if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(nodeData.start_idx, nodeData.end_idx);
                }
            } else {
                const startPos = editor.getModel().getPositionAt(nodeData.start_idx);
                const endPos = editor.getModel().getPositionAt(nodeData.end_idx);
                const range = new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column);

                hoverDecorations = editor.deltaDecorations(hoverDecorations, [
                    {
                        range: range,
                        options: {
                            className: 'bg-emerald-500/20 border-b-2 border-emerald-500 border-dashed',
                            hoverMessage: { value: `**AST Node:** ${nodeData.label} (${nodeData.type})` }
                        }
                    }
                ]);
                revealMonacoRange(range);
            }
        }
    }
    d3.select(`#node-${nodeData.id}`).classed('highlighted', true);
}

function clearBidirectionalHighlights() {
    if (editor && !editor.isFallback) {
        hoverDecorations = editor.deltaDecorations(hoverDecorations, []);
    }
    d3.selectAll('.d3-node').classed('highlighted', false);
    d3.selectAll('.d3-link').classed('highlighted', false);
}

function highlightTokenInEditor(tok) {
    if (!editor) return;
    if (editor.isFallback) {
        const textarea = document.getElementById('fallback-textarea');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(tok.start_idx, tok.end_idx);
        }
        return;
    }
    const startPos = editor.getModel().getPositionAt(tok.start_idx);
    const endPos = editor.getModel().getPositionAt(tok.end_idx);
    
    const range = new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column);
    editor.setSelection(range);
    revealMonacoRange(range);
    
    if (currentAST) {
        clearBidirectionalHighlights();
        const matchingNode = findASTNodeByOffset(currentAST, tok.start_idx, tok.end_idx);
        if (matchingNode) {
            d3.select(`#node-${matchingNode.id}`).classed('highlighted', true);
        }
    }
}

function highlightRangeInEditor(startLine, startCol, endLine, endCol) {
    if (!editor || editor.isFallback) return;
    const range = new monaco.Range(startLine, startCol, endLine, endCol);
    editor.setSelection(range);
    revealMonacoRange(range);
}

function findASTNodeByOffset(node, start, end) {
    if (node.start_idx === start && node.end_idx === end) {
        return node;
    }
    if (node.children) {
        for (let child of node.children) {
            const found = findASTNodeByOffset(child, start, end);
            if (found) return found;
        }
    }
    return null;
}

let tooltipDiv = null;
function showTooltip(event, nodeData) {
    if (!tooltipDiv) {
        tooltipDiv = d3.select('body')
            .append('div')
            .attr('class', 'node-tooltip');
    }
    
    tooltipDiv.html(`
        <div class="font-bold text-slate-100">${nodeData.label}</div>
        <div class="text-slate-400 mt-0.5">Tipo: <span class="text-blue-400 font-semibold">${nodeData.type}</span></div>
        <div class="text-slate-500 mt-1 border-t border-slate-800 pt-1 text-xxs">Pos: L:${nodeData.line} C:${nodeData.col}</div>
    `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 15) + 'px')
    .style('opacity', 1);
}

function hideTooltip() {
    if (tooltipDiv) {
        tooltipDiv.style('opacity', 0);
    }
}


function resetTracePlayer() {
    pauseTrace();
    tracePlayer.currentIndex = -1;
    tracePlayer.isPlaying = false;
    
    const playBtn = document.getElementById('btn-step-play');
    playBtn.innerText = 'Ejecutar Paso a Paso';
    playBtn.className = 'px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all duration-300';
    playBtn.disabled = (currentTrace.length === 0);
    
    updateTraceUI();
}

function updateTraceUI() {
    const totalSteps = currentTrace.length;
    const current = tracePlayer.currentIndex + 1;
    document.getElementById('step-info').innerText = `Paso ${current} / ${totalSteps}`;
    
    const prevBtn = document.getElementById('btn-step-prev');
    const nextBtn = document.getElementById('btn-step-next');
    const playBtn = document.getElementById('btn-step-play');

    prevBtn.disabled = (tracePlayer.currentIndex <= -1);
    nextBtn.disabled = (tracePlayer.currentIndex >= totalSteps - 1);
    playBtn.disabled = (totalSteps === 0);
    
    if (tracePlayer.currentIndex === -1) {
        document.getElementById('step-action').innerHTML = '&gt;_ Listo para reproducir';
        if (totalSteps > 0) {
            document.getElementById('step-details').innerText = `${totalSteps} pasos disponibles. Presiona "Ejecutar Paso a Paso" para animar la compilación.`;
        } else {
            document.getElementById('step-details').innerText = 'Analiza el código primero para generar la traza de ejecución.';
        }
        clearTraceHighlights();
    }
}

function toggleTracePlay() {
    if (currentTrace.length === 0) {
        showToast("Primero analiza el código para generar la traza de pasos.", "warning");
        return;
    }
    if (tracePlayer.isPlaying) {
        pauseTrace();
    } else {
        playTrace();
    }
}

function playTrace() {
    if (currentTrace.length === 0) {
        showToast("No hay pasos disponibles. Analiza el código primero.", "warning");
        return;
    }
    
    tracePlayer.isPlaying = true;
    const playBtn = document.getElementById('btn-step-play');
    playBtn.innerText = 'Pausar ⏸';
    playBtn.className = 'px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition-all duration-300';
    if (tracePlayer.currentIndex >= currentTrace.length - 1) {
        tracePlayer.currentIndex = -1;
        clearTraceHighlights();
    }

    stepNext();
    
    tracePlayer.intervalId = setInterval(() => {
        if (tracePlayer.currentIndex < currentTrace.length - 1) {
            stepNext();
        } else {
            pauseTrace();
            showToast(`Ejecución Paso a Paso finalizada (${currentTrace.length} pasos)`, "success");
            const btn = document.getElementById('btn-step-play');
            btn.innerText = 'Repetir ↺';
            btn.className = 'px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all duration-300';
        }
    }, tracePlayer.speed);
}

function pauseTrace() {
    tracePlayer.isPlaying = false;
    const playBtn = document.getElementById('btn-step-play');
    if (!playBtn.innerText.includes('Repetir')) {
        playBtn.innerText = 'Reanudar ▶';
        playBtn.className = 'px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all duration-300';
    }
    if (tracePlayer.intervalId) {
        clearInterval(tracePlayer.intervalId);
        tracePlayer.intervalId = null;
    }
}

function stepNext() {
    if (tracePlayer.currentIndex < currentTrace.length - 1) {
        tracePlayer.currentIndex++;
        applyTraceStep(tracePlayer.currentIndex);
        updateTraceUI();
    }
}

function stepPrev() {
    if (tracePlayer.currentIndex > -1) {
        tracePlayer.currentIndex--;
        clearTraceHighlights();
        
        for (let i = 0; i <= tracePlayer.currentIndex; i++) {
            applyTraceStep(i);
        }
        updateTraceUI();
    }
}

function applyTraceStep(index) {
    const step = currentTrace[index];
    if (!step) return;

    const actionText = document.getElementById('step-action');
    const detailsText = document.getElementById('step-details');
    
    clearTraceHighlights();

    switch (step.action) {
        case 'enter_rule':
            actionText.innerHTML = `<span class="text-blue-400">Entrando a Regla Gramatical</span>`;
            detailsText.innerHTML = `Analizando nodo sintáctico: <strong class="text-slate-200 font-mono">${step.rule}</strong>`;
            break;
            
        case 'exit_rule':
            actionText.innerHTML = `<span class="text-indigo-400">Completada Regla Gramatical</span>`;
            detailsText.innerHTML = `Saliendo de la regla <strong class="text-slate-200 font-mono">${step.rule}</strong>${step.node_id ? ` (Nodo AST ID: ${step.node_id})` : ''}`;
            
            if (step.node_id) {
                d3.select(`#node-${step.node_id}`).classed('active-step', true);
                centerNodeInViewport(step.node_id);
            }
            break;
            
        case 'consume':
            const tok = step.token;
            actionText.innerHTML = `<span class="text-emerald-400">Consumiendo Token</span>`;
            detailsText.innerHTML = `Lexema: <strong class="text-emerald-300 font-mono">${escapeHtml(tok.value)}</strong> | Tipo: <strong class="text-blue-300">${tok.type}</strong> | Posición: [L:${tok.line}, C:${tok.column}]`;
            
            highlightTokenRow(tok);
            highlightTokenInEditorDuringTrace(tok);
            break;
            
        case 'create_node':
            actionText.innerHTML = `<span class="text-amber-400">Creando Nodo AST</span>`;
            detailsText.innerHTML = `Nodo: <strong class="text-amber-300 font-mono">${step.label}</strong> | Tipo: <strong class="text-indigo-300">${step.type}</strong>`;
            
            d3.select(`#node-${step.node_id}`).classed('active-step', true);
            centerNodeInViewport(step.node_id);
            break;
            
        case 'add_child':
            actionText.innerHTML = `<span class="text-purple-400">Conectando Nodos</span>`;
            detailsText.innerHTML = `Vinculando Nodo Padre ID <strong class="text-slate-200">${step.parent_id}</strong> &rarr; Nodo Hijo ID <strong class="text-slate-200">${step.child_id}</strong>`;
            
            d3.select(`#link-${step.parent_id}-${step.child_id}`).classed('active-step', true);
            break;
            
        case 'synchronize':
            actionText.innerHTML = `<span class="text-red-400">Sincronización del Parser</span>`;
            detailsText.innerHTML = `<span class="text-red-300 font-semibold">${step.message}</span>`;
            break;
            
        case 'error':
            actionText.innerHTML = `<span class="text-red-500 font-bold">¡Error Detectado!</span>`;
            detailsText.innerHTML = `<span class="text-red-300 font-mono">${escapeHtml(step.message)}</span>`;
            
            highlightRangeInEditor(step.line, step.column, step.line, step.column + 2);
            break;
    }
}

function centerNodeInViewport(nodeId) {
    const nodeElement = d3.select(`#node-${nodeId}`);
    if (nodeElement.empty() || !d3Zoom || !svgElement) return;

    const transform = d3.zoomTransform(svgElement);
    const container = document.getElementById('tree-container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 400;

    const nodeData = nodeElement.datum();
    if (!nodeData) return;

    const x = nodeData.xPosition;
    const y = nodeData.yPosition;
    
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return;

    const scale = Math.max(0.5, transform.k);
    const nextTransform = d3.zoomIdentity
        .translate(width / 2 - x * scale, height / 2 - y * scale)
        .scale(scale);

    d3.select(svgElement)
        .transition()
        .duration(400)
        .call(d3Zoom.transform, nextTransform);
}

function highlightTokenRow(tok) {
    const rows = document.querySelectorAll('#tokens-table-body tr');
    rows.forEach(r => r.classList.remove('token-row-active'));
    
    const index = currentTokens.findIndex(t => t.start_idx === tok.start_idx && t.end_idx === tok.end_idx);
    if (index !== -1) {
        const row = document.getElementById(`token-row-${index}`);
        if (row) {
            row.classList.add('token-row-active');
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

let traceEditorDecorations = [];
function highlightTokenInEditorDuringTrace(tok) {
    if (!editor) return;
    if (editor.isFallback) {
        const textarea = document.getElementById('fallback-textarea');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(tok.start_idx, tok.end_idx);
        }
        return;
    }
    const startPos = editor.getModel().getPositionAt(tok.start_idx);
    const endPos = editor.getModel().getPositionAt(tok.end_idx);
    
    traceEditorDecorations = editor.deltaDecorations(traceEditorDecorations, [
        {
            range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
            options: {
                className: 'bg-blue-500/20 border-b-2 border-blue-500 border-solid',
                isWholeLine: false
            }
        }
    ]);
    revealMonacoRange(new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column));
}

function clearTraceHighlights() {
    d3.selectAll('.d3-node').classed('active-step', false);
    d3.selectAll('.d3-link').classed('active-step', false);
    document.querySelectorAll('#tokens-table-body tr').forEach(r => r.classList.remove('token-row-active'));
    
    if (editor && !editor.isFallback && traceEditorDecorations.length > 0) {
        traceEditorDecorations = editor.deltaDecorations(traceEditorDecorations, []);
    }
}


function exportTreePNG() {
    if (!svgElement) {
        showToast("No hay ningún árbol sintáctico para exportar", "warning");
        return;
    }

    try {
        showToast("Generando PNG del árbol...", "info");
        
        const svgClone = svgElement.cloneNode(true);
        
        const style = document.createElement('style');
        style.textContent = `
            .d3-link { fill: none; stroke: #1b264f; stroke-width: 1.5px; }
            .d3-node circle { stroke-width: 2px; }
            .d3-node-Program circle { fill: #1e1b4b; stroke: #3b82f6; }
            .d3-node-Assign circle { fill: #1a103c; stroke: #8b5cf6; }
            .d3-node-BinOp circle { fill: #3c1e10; stroke: #f59e0b; }
            .d3-node-Variable circle { fill: #064e3b; stroke: #10b981; }
            .d3-node-Number circle { fill: #0f4c5c; stroke: #2dd4bf; }
            .d3-node text { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 500; fill: #cbd5e1; }
        `;
        svgClone.insertBefore(style, svgClone.firstChild);

        svgClone.style.backgroundColor = '#05070f';

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgClone);
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = svgElement.clientWidth * 2;
            canvas.height = svgElement.clientHeight * 2;
            const context = canvas.getContext('2d');
            
            context.fillStyle = '#05070f';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.scale(2, 2);
            context.drawImage(image, 0, 0, svgElement.clientWidth, svgElement.clientHeight);
            
            const pngURL = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngURL;
            downloadLink.download = `arbol_ast_${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            showToast("PNG del árbol descargado con éxito", "success");
        };
        
        image.src = blobURL;
        
    } catch (e) {
        console.error("Error al exportar PNG:", e);
        showToast("Error exportando árbol como PNG", "error");
    }
}

async function generatePDFReport() {
    showToast("Generando reporte de compilación...", "info");
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const code = editor.getValue();
    
    const textPrimary = [15, 23, 42];
    const textSecondary = [71, 85, 105];
    const colorAccent = [13, 148, 136];
    const bgLight = [248, 250, 252];
    const borderColor = [226, 232, 240];
    let pageNum = 1;

    doc.setFillColor(...colorAccent);
    doc.rect(0, 0, 210, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...textPrimary);
    doc.text("REPORTE DE COMPILACIÓN", 20, 35);
    
    doc.setFontSize(13);
    doc.setTextColor(59, 130, 246);
    doc.text("Analizador Sintáctico EBNF LL(1) / LL(2)", 20, 43);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...textSecondary);
    doc.text(`Fecha y hora de análisis: ${new Date().toLocaleString()}`, 20, 52);
    doc.text("Asignatura: Teoría de Compiladores (Proyecto Final)", 20, 57);
    
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(20, 65, 190, 65);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...textPrimary);
    doc.text("1. Código Fuente Analizado:", 20, 75);
    
    doc.setFillColor(...bgLight);
    doc.setDrawColor(...borderColor);
    doc.rect(20, 80, 170, 125, 'FD');
    
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    
    const splitCode = doc.splitTextToSize(code, 160);
    doc.text(splitCode, 25, 90);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...textPrimary);
    doc.text("2. Resultado del Diagnóstico:", 20, 222);
    
    const errorsCount = currentErrors.length;
    if (errorsCount === 0) {
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(153, 246, 228);
        doc.rect(20, 228, 170, 26, 'FD');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(13, 148, 136);
        doc.text("Compilacion exitosa: no se detectaron errores de sintaxis o semantica.", 25, 236);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...textSecondary);
        doc.text(`Total de variables inferidas: ${currentSymbols.length}  |  Tokens analizados: ${currentTokens.length}`, 25, 245);
    } else {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.rect(20, 228, 170, 26, 'FD');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(220, 38, 38);
        doc.text(`Error de compilacion: se encontraron ${errorsCount} incidencia(s).`, 25, 236);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...textSecondary);
        doc.text("Por favor, revisa el listado detallado de errores al final de este documento.", 25, 245);
    }
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textSecondary);
    doc.text(`Página ${pageNum}`, 100, 285);
    pageNum++;
    
    doc.addPage();
    doc.setFillColor(...colorAccent);
    doc.rect(0, 0, 210, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...textPrimary);
    doc.text("Estructura Jerárquica del AST", 20, 23);
    
    doc.setDrawColor(...borderColor);
    doc.line(20, 28, 190, 28);
    
    if (currentAST && svgElement) {
        try {
            const treeContainer = document.getElementById('tree-container');
            const canvas = await html2canvas(treeContainer, {
                backgroundColor: '#05070f', // Mantiene fondo oscuro del gráfico para contraste neon
                scale: 2
            });
            const imgData = canvas.toDataURL('image/png');
            
            doc.addImage(imgData, 'PNG', 20, 34, 170, 110);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(...textSecondary);
            doc.text("El árbol AST ilustra la precedencia matemática y las reglas de asignación.", 20, 150);
        } catch (e) {
            console.error("Error cargando AST para el PDF:", e);
            doc.setTextColor(220, 38, 38);
            doc.text("No se pudo renderizar la captura del árbol AST.", 20, 50);
        }
    } else {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(220, 38, 38);
        doc.text("Árbol AST no disponible debido a fallas de parsing de código.", 20, 50);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...textPrimary);
    doc.text("Tabla de Símbolos:", 20, 175);
    
    let currentY = 182;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentY, 170, 8, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...textPrimary);
    doc.text("Variable", 22, currentY + 5.5);
    doc.text("Tipo Inferido", 65, currentY + 5.5);
    doc.text("Valor Constante", 110, currentY + 5.5);
    doc.text("Declaración (L,C)", 155, currentY + 5.5);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    currentY += 8;
    
    if (currentSymbols.length === 0) {
        doc.text("No se detectaron declaraciones de variables en la tabla.", 22, currentY + 6);
    } else {
        currentSymbols.forEach(sym => {
            if (currentY < 270) {
                doc.text(sym.name, 22, currentY + 5.5);
                doc.text(sym.type, 65, currentY + 5.5);
                doc.text(sym.value, 110, currentY + 5.5);
                doc.text(`${sym.line}:${sym.column}`, 155, currentY + 5.5);
                currentY += 7;
                doc.setDrawColor(241, 245, 249);
                doc.line(20, currentY, 190, currentY);
            }
        });
    }
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textSecondary);
    doc.text(`Página ${pageNum}`, 100, 285);
    pageNum++;

    doc.addPage();
    doc.setFillColor(...colorAccent);
    doc.rect(0, 0, 210, 8, 'F');
    
    if (errorsCount > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(220, 38, 38);
        doc.text("Detalle de Errores de Compilación", 20, 23);
        
        doc.setDrawColor(...borderColor);
        doc.line(20, 28, 190, 28);
        
        let errorY = 36;
        currentErrors.forEach((err, i) => {
            if (errorY < 260) {
                doc.setFillColor(254, 242, 242);
                doc.setDrawColor(254, 202, 202);
                doc.rect(20, errorY, 170, 24, 'FD');
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9.5);
                doc.setTextColor(220, 38, 38);
                doc.text(`Error #${i+1} (${err.type}): Línea ${err.line}, Columna ${err.column}`, 23, errorY + 5.5);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(51, 65, 85);
                doc.text(err.message, 23, errorY + 11.5);
                
                if (err.suggestion) {
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(180, 83, 9);
                    doc.text(`Sugerencia: `, 23, errorY + 17.5);
                    doc.setFont("helvetica", "normal");
                    doc.text(err.suggestion, 43, errorY + 17.5);
                }
                
                errorY += 28;
            }
        });
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...textPrimary);
        doc.text("Listado de Componentes Léxicos (Tokens)", 20, 23);
        
        doc.setDrawColor(...borderColor);
        doc.line(20, 28, 190, 28);
        
        let tokenY = 36;
        doc.setFillColor(241, 245, 249);
        doc.rect(20, tokenY, 170, 7, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...textPrimary);
        doc.text("#", 22, tokenY + 5);
        doc.text("Lexema", 35, tokenY + 5);
        doc.text("Tipo Interno", 85, tokenY + 5);
        doc.text("Ubicación (L:C)", 145, tokenY + 5);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        tokenY += 7;
        
        currentTokens.slice(0, 32).forEach((tok, index) => {
            if (tokenY < 270) {
                doc.text((index + 1).toString(), 22, tokenY + 5);
                doc.text(tok.value.substring(0, 20), 35, tokenY + 5);
                doc.text(tok.type, 85, tokenY + 5);
                doc.text(`${tok.line}:${tok.column}`, 145, tokenY + 5);
                tokenY += 6.5;
                doc.setDrawColor(241, 245, 249);
                doc.line(20, tokenY, 190, tokenY);
            }
        });
        
        if (currentTokens.length > 32) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(...textSecondary);
            doc.text(`... y ${currentTokens.length - 32} tokens adicionales listados en el panel principal.`, 22, tokenY + 5);
        }
    }
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textSecondary);
    doc.text(`Página ${pageNum}`, 100, 285);
    pageNum++;

    if (errorsCount === 0 && currentTAC && currentTAC.length > 0) {
        doc.addPage();
        doc.setFillColor(...colorAccent);
        doc.rect(0, 0, 210, 8, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...textPrimary);
        doc.text("3. Código Intermedio de Tres Direcciones (TAC)", 20, 23);
        
        doc.setDrawColor(...borderColor);
        doc.line(20, 28, 190, 28);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...textSecondary);
        doc.text("Traducción del Árbol de Sintaxis Abstracta a instrucciones lineales de tres direcciones:", 20, 35);
        
        doc.setFillColor(...bgLight);
        doc.setDrawColor(...borderColor);
        doc.rect(20, 42, 170, 220, 'FD');
        
        doc.setFont("courier", "bold");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        
        const tacText = currentTAC.join('\n');
        const splitTac = doc.splitTextToSize(tacText, 160);
        doc.text(splitTac, 25, 52);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...textSecondary);
        doc.text(`Página ${pageNum}`, 100, 285);
    }
    
    doc.save(`reporte_compilacion_${Date.now()}.pdf`);
    showToast("Reporte PDF descargado con éxito", "success");
}


function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.replace('block', 'hidden');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`content-${tabId}`).classList.replace('hidden', 'block');
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    
    toast.className = "fixed bottom-5 right-5 px-5 py-3 rounded-lg border text-xs font-mono shadow-2xl transition-all duration-500 transform z-50 ";
    
    if (type === "success") {
        toast.className += "bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10";
    } else if (type === "error") {
        toast.className += "bg-red-950/90 text-red-300 border-red-500/40 shadow-red-500/10";
    } else if (type === "warning") {
        toast.className += "bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-amber-500/10";
    } else {
        toast.className += "bg-slate-900/95 text-slate-300 border-cyber-border shadow-slate-900/40";
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3500);
}
