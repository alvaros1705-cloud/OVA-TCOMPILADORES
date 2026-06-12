/**
 * Portal USB — Centro de Aprendizaje (Fase 14A)
 * Guía, ejemplos, quiz, ahorcado, sopa de letras, apareamiento y estadísticas.
 */
const LearningHub = (() => {
  const STORAGE_KEY = 'usb-learning-progress';
  const TOTAL_ACTIVITIES = 6; // quiz + 3 juegos + guía visitada + ejemplos vistos opcional - user wants quiz completions, games completed, progress %

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderProgressStats();
  }

  function markActivity(key) {
    const p = getProgress();
    p[key] = true;
    saveProgress(p);
  }

  function incrementCounter(key) {
    const p = getProgress();
    p[key] = (p[key] || 0) + 1;
    saveProgress(p);
  }

  function computeAdvancePercent(p) {
    let done = 0;
    if (p.guideVisited) done++;
    if (p.examplesVisited) done++;
    if (p.quizCompletions > 0) done++;
    if (p.hangmanWins > 0) done++;
    if (p.wordSearchCompleted) done++;
    if (p.matchingCompleted) done++;
    return Math.round((done / TOTAL_ACTIVITIES) * 100);
  }

  function renderProgressStats() {
    const el = document.getElementById('learning-progress-stats');
    if (!el) return;
    const p = getProgress();
    const pct = computeAdvancePercent(p);
    el.innerHTML = `
      <div class="learning-stat-row">
        <span class="learning-stat-label">Quizzes completados</span>
        <span class="learning-stat-val">${p.quizCompletions || 0}</span>
      </div>
      <div class="learning-stat-row">
        <span class="learning-stat-label">Victorias ahorcado</span>
        <span class="learning-stat-val">${p.hangmanWins || 0}</span>
      </div>
      <div class="learning-stat-row">
        <span class="learning-stat-label">Sopa completada</span>
        <span class="learning-stat-val">${p.wordSearchCompleted ? 'Sí' : 'No'}</span>
      </div>
      <div class="learning-stat-row">
        <span class="learning-stat-label">Apareamiento logrado</span>
        <span class="learning-stat-val">${p.matchingCompleted ? 'Sí' : 'No'}</span>
      </div>
      <div class="learning-stat-progress">
        <span>Avance general: <strong>${pct}%</strong></span>
        <div class="learning-progress-track"><div class="learning-progress-bar" style="width:${pct}%"></div></div>
      </div>
    `;
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el?.showModal) el.showModal();
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el?.close) el.close();
  }

  function bindCloseButtons() {
    document.querySelectorAll('[data-learning-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-learning-close')));
    });
  }

  function bindCardButtons() {
    document.querySelectorAll('[data-learning-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-learning-open');
        const initFn = btn.getAttribute('data-learning-init');
        if (initFn && typeof LearningHub[initFn] === 'function') LearningHub[initFn]();
        openModal(modalId);
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Módulo 1: Guía con tabs ── */
  function initGuide() {
    renderGuide();
    markActivity('guideVisited');
  }

  function initExamples() {
    renderExamples();
    markActivity('examplesVisited');
  }

  function renderGuide() {
    const container = document.getElementById('learning-guide-body');
    if (!container || !LEARNING_DATA?.guide) return;

    const tabs = LEARNING_DATA.guide.map((g, i) =>
      `<button type="button" class="learning-guide-tab${i === 0 ? ' active' : ''}" data-guide-tab="${i}">${String(i + 1).padStart(2, '0')}</button>`
    ).join('');

    const panels = LEARNING_DATA.guide.map((g, i) => `
      <div class="learning-guide-panel${i === 0 ? ' active' : ''}" data-guide-panel="${i}">
        <header class="learning-guide-panel-head learning-phase-${g.color}">
          <h3>${g.title}</h3>
          <span>${g.ova}</span>
        </header>
        ${g.steps.map(s => `
          <details class="learning-accordion" open>
            <summary class="learning-accordion-head-inline">${s.heading}</summary>
            <div class="learning-accordion-body"><p>${s.text}</p></div>
          </details>
        `).join('')}
      </div>
    `).join('');

    container.innerHTML = `
      <div class="learning-guide-tabs" role="tablist">${tabs}</div>
      <div class="learning-guide-panels">${panels}</div>
    `;

    container.querySelectorAll('.learning-guide-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const idx = tab.dataset.guideTab;
        container.querySelectorAll('.learning-guide-tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.learning-guide-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        container.querySelector(`[data-guide-panel="${idx}"]`)?.classList.add('active');
      });
    });
  }

  /* ── Módulo 2: Ejemplos ── */
  function renderExamples() {
    const container = document.getElementById('learning-examples-body');
    if (!container) return;

    container.innerHTML = LEARNING_DATA.examples.map((ex, i) => `
      <article class="learning-example-card" data-example="${i}">
        <header class="learning-example-head">
          <h3>${ex.title}</h3>
          <span class="learning-tag">${ex.topic}</span>
        </header>
        <pre class="learning-code"><code>${escapeHtml(ex.code)}</code></pre>
        <p class="learning-explain"><strong>Explicación:</strong> ${ex.explanation}</p>
        <p class="learning-result"><strong>Resultado esperado:</strong> ${ex.result}</p>
      </article>
    `).join('');
  }

  /* ── Módulo 3: Quiz ── */
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  function initQuiz() {
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    document.getElementById('learning-quiz-result')?.classList.add('hidden');
    document.getElementById('learning-quiz-active')?.classList.remove('hidden');
    const live = document.getElementById('learning-quiz-live-score');
    if (live) live.textContent = '0';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const q = LEARNING_DATA.quiz[quizIndex];
    const total = LEARNING_DATA.quiz.length;
    if (!q) return;

    document.getElementById('learning-quiz-progress').textContent = `Pregunta ${quizIndex + 1} de ${total} · Puntaje: ${quizScore}`;
    document.getElementById('learning-quiz-bar').style.width = `${Math.round((quizIndex / total) * 100)}%`;
    document.getElementById('learning-quiz-question').textContent = q.q;
    const fb = document.getElementById('learning-quiz-feedback');
    if (fb) { fb.textContent = ''; fb.className = 'learning-quiz-feedback'; }

    const opts = document.getElementById('learning-quiz-options');
    const labels = ['A', 'B', 'C', 'D'];
    opts.innerHTML = q.options.map((opt, i) =>
      `<button type="button" class="learning-quiz-opt" data-idx="${i}">${labels[i]}. ${opt}</button>`
    ).join('');
    opts.querySelectorAll('.learning-quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => answerQuiz(parseInt(btn.dataset.idx, 10), btn));
    });
    quizAnswered = false;
  }

  function answerQuiz(selected, btnEl) {
    if (quizAnswered) return;
    quizAnswered = true;
    const q = LEARNING_DATA.quiz[quizIndex];
    const fb = document.getElementById('learning-quiz-feedback');
    document.querySelectorAll('.learning-quiz-opt').forEach(b => { b.disabled = true; });

    if (selected === q.correct) {
      quizScore++;
      if (fb) { fb.textContent = '✓ Correcto'; fb.className = 'learning-quiz-feedback ok'; }
      btnEl.classList.add('correct');
    } else {
      if (fb) { fb.textContent = '✗ Incorrecto'; fb.className = 'learning-quiz-feedback err'; }
      btnEl.classList.add('wrong');
      document.querySelectorAll('.learning-quiz-opt')[q.correct]?.classList.add('correct');
    }
    const live = document.getElementById('learning-quiz-live-score');
    if (live) live.textContent = String(quizScore);

    setTimeout(() => {
      quizIndex++;
      if (quizIndex >= LEARNING_DATA.quiz.length) showQuizResult();
      else renderQuizQuestion();
    }, 1100);
  }

  function showQuizResult() {
    document.getElementById('learning-quiz-active')?.classList.add('hidden');
    document.getElementById('learning-quiz-result')?.classList.remove('hidden');

    let level = '🏅 Principiante';
    if (quizScore >= 16) level = '🥇 Avanzado';
    else if (quizScore >= 9) level = '🥈 Intermedio';

    document.getElementById('learning-quiz-score').textContent =
      `${quizScore} / 20 puntos (${Math.round(quizScore / 20 * 100)}%)`;
    document.getElementById('learning-quiz-level').textContent = level;

    const p = getProgress();
    p.quizCompletions = (p.quizCompletions || 0) + 1;
    p.quizBest = Math.max(p.quizBest || 0, quizScore);
    saveProgress(p);
  }

  /* ── Módulo 4: Ahorcado ── */
  const HANGMAN_MAX = 6;
  let hangmanWord = '';
  let hangmanGuessed = new Set();
  let hangmanWrong = 0;
  let hangmanWinsSession = 0;
  let hangmanResolved = false;

  function initHangman() {
    pickHangmanWord();
    renderHangman();
  }

  function pickHangmanWord() {
    const words = LEARNING_DATA.hangmanWords;
    hangmanWord = words[Math.floor(Math.random() * words.length)];
    hangmanGuessed = new Set();
    hangmanWrong = 0;
    hangmanResolved = false;
  }

  function renderHangman() {
    const display = document.getElementById('hangman-word-display');
    const wrongEl = document.getElementById('hangman-wrong-count');
    const winsEl = document.getElementById('hangman-wins-count');
    const fb = document.getElementById('hangman-feedback');
    const kb = document.getElementById('hangman-keyboard');
    if (!display || !kb) return;

    display.innerHTML = hangmanWord.split('').map(ch =>
      ch === '_' ? '<span class="hangman-space">&nbsp;</span>'
        : `<span class="hangman-char">${hangmanGuessed.has(ch) ? ch : '·'}</span>`
    ).join('');

    if (wrongEl) wrongEl.textContent = String(hangmanWrong);
    if (winsEl) winsEl.textContent = String(hangmanWinsSession);

    const unique = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    kb.innerHTML = unique.map(L => {
      const used = hangmanGuessed.has(L);
      const isWrong = used && !hangmanWord.includes(L);
      return `<button type="button" class="hangman-key${used ? (isWrong ? ' wrong' : ' ok') : ''}" data-letter="${L}" ${used ? 'disabled' : ''}>${L}</button>`;
    }).join('');

    kb.querySelectorAll('.hangman-key:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => guessLetter(btn.dataset.letter));
    });

    const won = [...hangmanWord.replace(/_/g, '')].every(c => hangmanGuessed.has(c));
    if (won && !hangmanResolved) {
      hangmanResolved = true;
      if (fb) fb.textContent = `✓ ¡Correcto! La palabra era ${hangmanWord}.`;
      hangmanWinsSession++;
      incrementCounter('hangmanWins');
      kb.querySelectorAll('button').forEach(b => b.disabled = true);
    } else if (won) {
      if (fb) fb.textContent = `✓ ¡Correcto! La palabra era ${hangmanWord}.`;
      kb.querySelectorAll('button').forEach(b => b.disabled = true);
    } else if (hangmanWrong >= HANGMAN_MAX && !hangmanResolved) {
      hangmanResolved = true;
      if (fb) fb.textContent = `✗ Sin intentos. La palabra era ${hangmanWord}.`;
      kb.querySelectorAll('button').forEach(b => b.disabled = true);
    } else if (hangmanWrong >= HANGMAN_MAX) {
      if (fb) fb.textContent = `✗ Sin intentos. La palabra era ${hangmanWord}.`;
      kb.querySelectorAll('button').forEach(b => b.disabled = true);
    } else if (fb) fb.textContent = `Intentos restantes: ${HANGMAN_MAX - hangmanWrong}`;
  }

  function guessLetter(L) {
    if (hangmanGuessed.has(L)) return;
    hangmanGuessed.add(L);
    if (!hangmanWord.includes(L)) hangmanWrong++;
    renderHangman();
  }

  function resetHangman() {
    pickHangmanWord();
    const fb = document.getElementById('hangman-feedback');
    if (fb) fb.textContent = '';
    renderHangman();
  }

  /* ── Módulo 5: Sopa de letras 12×12 ── */
  const WS_SIZE = 12;
  let wsGrid = [];
  let wsFound = new Set();
  let wsSelecting = null;
  let wsCompleted = false;

  function initWordSearch() {
    wsFound = new Set();
    wsSelecting = null;
    wsCompleted = false;
    buildWordSearchGrid();
    renderWordSearch();
  }

  function buildWordSearchGrid() {
    wsGrid = Array.from({ length: WS_SIZE }, () => Array(WS_SIZE).fill(''));
    const words = [...LEARNING_DATA.wordSearchWords].sort((a, b) => b.length - a.length);
    const dirs = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1],[-1,1],[1,-1]];

    words.forEach(wordRaw => {
      const word = wordRaw.replace(/_/g, '');
      let placed = false;
      for (let attempt = 0; attempt < 80 && !placed; attempt++) {
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const r0 = Math.floor(Math.random() * WS_SIZE);
        const c0 = Math.floor(Math.random() * WS_SIZE);
        if (canPlaceWord(word, r0, c0, dr, dc)) {
          placeWord(word, r0, c0, dr, dc);
          placed = true;
        }
      }
    });

    const fill = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < WS_SIZE; r++) {
      for (let c = 0; c < WS_SIZE; c++) {
        if (!wsGrid[r][c]) wsGrid[r][c] = fill[Math.floor(Math.random() * fill.length)];
      }
    }
  }

  function canPlaceWord(word, r0, c0, dr, dc) {
    for (let i = 0; i < word.length; i++) {
      const r = r0 + dr * i, c = c0 + dc * i;
      if (r < 0 || r >= WS_SIZE || c < 0 || c >= WS_SIZE) return false;
      const cell = wsGrid[r][c];
      if (cell && cell !== word[i]) return false;
    }
    return true;
  }

  function placeWord(word, r0, c0, dr, dc) {
    for (let i = 0; i < word.length; i++) {
      wsGrid[r0 + dr * i][c0 + dc * i] = word[i];
    }
  }

  function renderWordSearch() {
    const gridEl = document.getElementById('wordsearch-grid');
    const listEl = document.getElementById('wordsearch-word-list');
    const fb = document.getElementById('wordsearch-feedback');
    if (!gridEl) return;

    gridEl.innerHTML = wsGrid.map((row, r) => row.map((ch, c) =>
      `<button type="button" class="ws-cell" data-r="${r}" data-c="${c}">${ch}</button>`
    ).join('')).join('');

    listEl.innerHTML = LEARNING_DATA.wordSearchWords.map(w => {
      const found = wsFound.has(w);
      return `<span class="ws-word-item${found ? ' found' : ''}">${w.replace('_', ' ')}</span>`;
    }).join('');

    gridEl.querySelectorAll('.ws-cell').forEach(cell => {
      cell.addEventListener('mousedown', e => startWsSelect(parseInt(cell.dataset.r, 10), parseInt(cell.dataset.c, 10)));
      cell.addEventListener('mouseenter', () => {
        if (wsSelecting) extendWsSelect(parseInt(cell.dataset.r, 10), parseInt(cell.dataset.c, 10));
      });
      cell.addEventListener('mouseup', endWsSelect);
      cell.addEventListener('touchstart', e => { e.preventDefault(); startWsSelect(parseInt(cell.dataset.r, 10), parseInt(cell.dataset.c, 10)); });
    });

    if (fb) {
      fb.textContent = `Encontradas: ${wsFound.size} / ${LEARNING_DATA.wordSearchWords.length}`;
      if (wsFound.size === LEARNING_DATA.wordSearchWords.length && !wsCompleted) {
        wsCompleted = true;
        fb.textContent = '✓ ¡Sopa completada!';
        markActivity('wordSearchCompleted');
      } else if (wsFound.size === LEARNING_DATA.wordSearchWords.length) {
        fb.textContent = '✓ ¡Sopa completada!';
      }
    }
    highlightWsCells();
  }

  function startWsSelect(r, c) {
    wsSelecting = { r0: r, c0: c, r1: r, c1: c };
    highlightWsCells();
  }

  function extendWsSelect(r, c) {
    if (!wsSelecting) return;
    wsSelecting.r1 = r;
    wsSelecting.c1 = c;
    highlightWsCells();
  }

  function endWsSelect() {
    if (!wsSelecting) return;
    const cells = getWsLineCells(wsSelecting);
    const word = cells.map(({ r, c }) => wsGrid[r][c]).join('');
    const rev = word.split('').reverse().join('');
    LEARNING_DATA.wordSearchWords.forEach(w => {
      const norm = w.replace(/_/g, '');
      if (word === w || rev === w || word === norm || rev === norm) wsFound.add(w);
    });
    wsSelecting = null;
    renderWordSearch();
  }

  function getWsLineCells(sel) {
    const dr = sel.r1 - sel.r0, dc = sel.c1 - sel.c0;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return [{ r: sel.r0, c: sel.c0 }];
    const ndr = dr === 0 ? 0 : dr / Math.abs(dr);
    const ndc = dc === 0 ? 0 : dc / Math.abs(dc);
    if (Math.abs(dr) !== Math.abs(dc) && dr !== 0 && dc !== 0) return [{ r: sel.r0, c: sel.c0 }];
    const out = [];
    for (let i = 0; i <= steps; i++) {
      out.push({ r: sel.r0 + ndr * i, c: sel.c0 + ndc * i });
    }
    return out;
  }

  function highlightWsCells() {
    document.querySelectorAll('.ws-cell').forEach(c => c.classList.remove('selected', 'found-cell'));
    wsFound.forEach(() => {});
    if (wsSelecting) {
      getWsLineCells(wsSelecting).forEach(({ r, c }) => {
        document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`)?.classList.add('selected');
      });
    }
  }

  function resetWordSearch() {
    initWordSearch();
  }

  /* ── Módulo 6: Apareamiento ── */
  let matchScore = 0;

  function initMatching() {
    matchScore = 0;
    const pool = document.getElementById('matching-pool');
    const targets = document.getElementById('matching-targets');
    const scoreEl = document.getElementById('matching-score');
    const fb = document.getElementById('matching-feedback');
    if (!pool || !targets) return;

    const pairs = [...LEARNING_DATA.matchingPairs].sort(() => Math.random() - 0.5);
    const defs = [...LEARNING_DATA.matchingPairs].sort(() => Math.random() - 0.5);

    pool.innerHTML = pairs.map(p =>
      `<div class="match-chip" draggable="true" data-term="${p.term}">${p.term}</div>`
    ).join('');

    targets.innerHTML = defs.map(p => `
      <div class="match-slot" data-def="${p.definition}">
        <span class="match-def-text">${p.definition}</span>
        <div class="match-drop"></div>
      </div>
    `).join('');

    if (scoreEl) scoreEl.textContent = '0';
    if (fb) fb.textContent = 'Arrastra cada término a su definición correcta.';

    let dragged = null;
    pool.querySelectorAll('.match-chip').forEach(chip => {
      chip.addEventListener('dragstart', () => { dragged = chip; chip.classList.add('dragging'); });
      chip.addEventListener('dragend', () => { dragged?.classList.remove('dragging'); dragged = null; });
    });

    targets.querySelectorAll('.match-drop').forEach(drop => {
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.parentElement.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.parentElement.classList.remove('over'));
      drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.parentElement.classList.remove('over');
        if (!dragged || drop.querySelector('.match-chip')) return;
        const slot = drop.parentElement;
        const term = dragged.dataset.term;
        const expected = LEARNING_DATA.matchingPairs.find(p => p.term === term)?.definition;
        drop.appendChild(dragged);
        if (expected === slot.dataset.def) {
          matchScore++;
          dragged.classList.add('correct');
          slot.classList.add('correct');
        } else {
          dragged.classList.add('wrong');
          slot.classList.add('wrong');
        }
        if (scoreEl) scoreEl.textContent = String(matchScore);
        checkMatchingComplete(fb);
      });
    });
  }

  function checkMatchingComplete(fb) {
    const total = LEARNING_DATA.matchingPairs.length;
    const placed = document.querySelectorAll('.match-drop .match-chip').length;
    if (placed < total) {
      if (fb) fb.textContent = `Emparejados: ${placed}/${total} · Aciertos: ${matchScore}`;
      return;
    }
    if (matchScore === total) {
      if (fb) fb.textContent = '✓ ¡Perfecto! Todos los conceptos emparejados correctamente.';
      markActivity('matchingCompleted');
    } else {
      if (fb) fb.textContent = `Completado con ${matchScore}/${total} aciertos. Reinicia para mejorar.`;
    }
  }

  function resetMatching() {
    initMatching();
  }

  function init() {
    bindCardButtons();
    bindCloseButtons();
    renderProgressStats();

    document.getElementById('hangman-reset-btn')?.addEventListener('click', resetHangman);
    document.getElementById('wordsearch-reset-btn')?.addEventListener('click', resetWordSearch);
    document.getElementById('matching-reset-btn')?.addEventListener('click', resetMatching);
    document.addEventListener('mouseup', () => {
      if (wsSelecting) endWsSelect();
    });
  }

  return {
    init,
    initGuide,
    initExamples,
    initQuiz,
    initHangman,
    initWordSearch,
    initMatching
  };
})();

window.LearningHub = LearningHub;
