/**
 * ==========================================================================
 * PORTAL ACADÉMICO OVAS COMPILADORES - SCRIPT INTERACTIVO DE PORTAL
 * Funcionalidad: Router SPA, Temas, Filtros, Iframe Loaders, Modales Académicos
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ── CONSTANTES Y CONFIGURACIÓN DE RUTAS DE OVAS ────────────────────────────
  const OVAS_ROUTES = {
    'analizador-lexico': {
      title: 'Analizador Léxico',
      author: 'Desarrollado por Marco & Cristian',
      path: 'OVAS/Marco - Cristian/analizador/index.html'
    },
    'analizador-sintactico': {
      title: 'Analizador Sintáctico',
      author: 'Desarrollado por Fabian & Sofi',
      path: 'OVAS/Fabian - Sofi/analizador-sintactico/frontend/index.html'
    },
    'analizador-semantico': {
      title: 'Analizador Semántico',
      author: 'Desarrollado por Kevin & Gabriel',
      path: 'OVAS/Kevin - Gabriel/compilador-semantico-web-main/index.html'
    },
    'mini-compilador': {
      title: 'Mini Compilador (Lexer, Parser & TAC)',
      author: 'Desarrollado por Islender & Jhoan',
      path: 'OVAS/Islender - Jhoan/mini_compiler/frontend/index.html'
    },
    'simulador-automatas': {
      title: 'Simulador de Autómatas Finitos (FASS)',
      author: 'Desarrollado por Ronald & Johel',
      path: 'OVAS/Ronald - Johel/FASS-Sistema-de-Simulaci-n-de-Aut-matas-Finitos/static/index.html'
    }
  };

  // Map de Ovas a sus respectivos Modales del DOM
  const OVA_MODAL_MAP = {
    'analizador-lexico': 'details-ova-1-modal',
    'analizador-sintactico': 'details-ova-2-modal',
    'analizador-semantico': 'details-ova-3-modal',
    'mini-compilador': 'details-ova-4-modal',
    'simulador-automatas': 'details-ova-5-modal'
  };

  // ── SELECCIÓN DE ELEMENTOS DEL DOM ─────────────────────────────────────────
  // Elementos de la Sidebar
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebar-close');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const hamburgerToggle = document.getElementById('hamburger-toggle');
  const navLinks = document.querySelectorAll('.nav-item');
  const searchInput = document.getElementById('ova-search');
  const ovaCards = document.querySelectorAll('.ova-card');

  // Elementos del Contenido y Visor
  const dashboardView = document.getElementById('dashboard-view');
  const ovaViewerView = document.getElementById('ova-viewer-view');
  const ovaIframe = document.getElementById('ova-iframe');
  const iframeLoader = document.getElementById('iframe-loader');
  const loaderStatus = document.getElementById('loader-status');
  
  // Controles del Visor
  const activeOvaTitle = document.getElementById('active-ova-title');
  const activeOvaAuthor = document.getElementById('active-ova-author');
  const btnReloadOva = document.getElementById('btn-reload-ova');
  const btnOpenExternal = document.getElementById('btn-open-external');
  const iframeWrapper = document.querySelector('.iframe-wrapper');

  // Ajustes de API, Modal y Tema
  const settingsDialog = document.getElementById('settings-dialog');
  const btnOpenSettings = document.getElementById('open-settings');
  const btnCloseSettings = document.getElementById('close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnResetSettings = document.getElementById('btn-reset-settings');
  const themeToggle = document.getElementById('theme-toggle');

  // Inyección del Botón de Pantalla Completa en la barra de controles
  injectFullscreenButton();
  const btnFullscreenOva = document.getElementById('btn-fullscreen-ova');

  // Nuevos Elementos Modales Académicos
  const btnAboutProject = document.getElementById('btn-about-project');
  const projectAboutModal = document.getElementById('project-about-modal');
  const btnExplore = document.getElementById('btn-explore');
  const cardInfoButtons = document.querySelectorAll('.btn-card-secondary');
  const closeDetailsButtons = document.querySelectorAll('.close-details-btn');
  const yearSpans = document.querySelectorAll('#current-year');

  // ── INICIALIZACIÓN DINÁMICA ───────────────────────────────────────────────
  // Inyección del año actual dinámicamente en los spans correspondientes
  const currentYear = new Date().getFullYear();
  yearSpans.forEach(span => span.textContent = currentYear);

  // ── CONTROL DEL MENÚ HAMBURGUESA (SIDEBAR) ──────────────────────────────────
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebarOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebarOverlay.setAttribute('aria-hidden', 'true');
  }

  if (hamburgerToggle) hamburgerToggle.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Cerrar sidebar en móviles al hacer click en un enlace de navegación
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1200) {
        closeSidebar();
      }
    });
  });

  // Scroll suave en Hero "Explorar OVAS"
  if (btnExplore) {
    btnExplore.addEventListener('click', (e) => {
      e.preventDefault();
      const targetAnchor = document.getElementById('ovas-grid-anchor');
      if (targetAnchor) {
        targetAnchor.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ── ENRUTADOR SPA BASADO EN HASH (ROUTER) ──────────────────────────────────
  function handleRoute() {
    const hash = window.location.hash || '#/';
    
    // Resetear clases activas de la barra lateral
    navLinks.forEach(link => link.classList.remove('active'));

    if (hash === '#/' || hash === '#') {
      if (!dashboardView || !ovaViewerView || !ovaIframe) return;

      // Mostrar Dashboard Principal
      dashboardView.style.display = 'block';
      ovaViewerView.style.display = 'none';
      ovaIframe.src = 'about:blank'; // Limpiar iframe anterior para ahorrar memoria
      
      const homeLink = document.getElementById('nav-home');
      if (homeLink) homeLink.classList.add('active');
      document.title = 'Portal Académico OVAS - Teoría de Compiladores | USB';
    } else if (hash.startsWith('#/ova/')) {
      const ovaName = hash.replace('#/ova/', '');
      const ova = OVAS_ROUTES[ovaName];

      if (ova) {
        if (!dashboardView || !ovaViewerView || !activeOvaTitle || !activeOvaAuthor || !ovaIframe) return;

        // Carga dinámica de la OVA seleccionada
        dashboardView.style.display = 'none';
        ovaViewerView.style.display = 'flex';
        
        activeOvaTitle.textContent = ova.title;
        activeOvaAuthor.textContent = ova.author;
        if (btnOpenExternal) btnOpenExternal.href = ova.path;

        // Mostrar Loader
        showLoader();
        
        // Asignar ruta al iframe
        ovaIframe.src = ova.path;

        // Actualizar clase activa del item en la barra lateral
        const activeLink = document.querySelector(`.nav-item[href="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');

        document.title = `${ova.title} | Portal OVAS USB`;
      } else {
        // Redireccionar al home si la ruta es inválida
        window.location.hash = '#/';
      }
    }
  }

  window.addEventListener('hashchange', handleRoute);
  // Inicializar ruta en la carga de la página
  handleRoute();

  // ── BUSCADOR DE OVAS (FILTRO EN TIEMPO REAL) ───────────────────────────────
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      ovaCards.forEach(card => {
        const titleText = card.getAttribute('data-title') || '';
        if (titleText.toLowerCase().includes(query)) {
          card.classList.remove('filtered');
        } else {
          card.classList.add('filtered');
        }
      });
    });
  }

  // ── INDICADOR DE CARGA E INTEL DE COMPILADOR ───────────────────────────────
  const loaderPhrases = [
    'Inicializando Analizador Léxico...',
    'Construyendo árbol sintáctico (AST)...',
    'Validando coherencia semántica...',
    'Generando código de tres direcciones...',
    'Simulando transiciones de autómatas...',
    'Optimizando cuádruplas lógicas...',
    'Cargando librerías de renderizado...'
  ];

  let loaderInterval = null;

  function showLoader() {
    if (!iframeLoader) return;
    iframeLoader.classList.remove('hidden');

    const statusEl = loaderStatus || document.getElementById('loader-status');
    if (!statusEl) return;

    // Animación de cambio de frases del compilador
    let phraseIdx = 0;
    statusEl.textContent = loaderPhrases[phraseIdx];

    if (loaderInterval) clearInterval(loaderInterval);

    loaderInterval = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % loaderPhrases.length;
      statusEl.textContent = loaderPhrases[phraseIdx];
    }, 1200);
  }

  function hideLoader() {
    iframeLoader.classList.add('hidden');
    if (loaderInterval) {
      clearInterval(loaderInterval);
      loaderInterval = null;
    }
  }

  // Ocultar cargador cuando el iframe finalice su carga
  ovaIframe.addEventListener('load', () => {
    hideLoader();
    // Inyectar configuraciones de API al iframe cargado
    injectSettingsToIframe();
  });

  // ── CONTROLES DEL VISOR (RECARGA, PANTALLA COMPLETA, EXTERNO) ───────────────
  // Recarga
  if (btnReloadOva) {
    btnReloadOva.addEventListener('click', () => {
      showLoader();
      ovaIframe.contentWindow.location.reload(true);
    });
  }

  // Pantalla Completa
  function injectFullscreenButton() {
    const controlsContainer = document.querySelector('.viewer-controls');
    if (controlsContainer && !document.getElementById('btn-fullscreen-ova')) {
      const fsBtn = document.createElement('button');
      fsBtn.className = 'btn-control';
      fsBtn.id = 'btn-fullscreen-ova';
      fsBtn.setAttribute('aria-label', 'Pantalla completa');
      fsBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
        <span>Pantalla Completa</span>
      `;
      // Insertar antes del botón de enlace externo
      controlsContainer.insertBefore(fsBtn, document.getElementById('btn-open-external'));
    }
  }

  if (btnFullscreenOva) {
    btnFullscreenOva.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        // Expandir el contenedor de iframe para mantener los controles visibles
        iframeWrapper.requestFullscreen().catch(err => {
          console.error(`Error al intentar pantalla completa: ${err.message}`);
          // Fallback a pantalla completa directa del iframe
          ovaIframe.requestFullscreen();
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Cambiar icono de pantalla completa según el estado real
  document.addEventListener('fullscreenchange', () => {
    if (!btnFullscreenOva) return;

    const label = btnFullscreenOva.querySelector('span');
    const iconPath = btnFullscreenOva.querySelector('path');

    if (document.fullscreenElement) {
      if (label) label.textContent = 'Salir Pantalla';
      if (iconPath) iconPath.setAttribute('d', 'M4 14h3v3m10-3h3v3M4 10h3V7m10 3h3V7');
    } else {
      if (label) label.textContent = 'Pantalla Completa';
      if (iconPath) iconPath.setAttribute('d', 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3');
    }
  });

  // ── CAMBIO DE TEMA CLARO/OSCURO CON LOCALSTORAGE ───────────────────────────
  function applyPortalTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    document.documentElement.setAttribute('data-portal-theme', theme);

    localStorage.setItem('theme', theme);

    if (ovaIframe && ovaIframe.src !== 'about:blank') {
      try {
        ovaIframe.contentWindow.postMessage({
          type: 'USB_THEME_CHANGED',
          theme: theme
        }, '*');
      } catch (e) {
        // Ignorar si hay políticas CORS restrictivas
      }
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    applyPortalTheme(savedTheme === 'light' ? 'light' : 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
      applyPortalTheme(nextTheme);
    });
  }

  initTheme();

  // ── DIÁLOGO DE AJUSTES & INTEGRACIÓN DE APIS (POSTMESSAGE) ─────────────────
  // Cargar valores iniciales de la base de datos local (LocalStorage)
  function loadSavedSettings() {
    const urls = ['sintactico', 'mini-compilador', 'automata'];
    urls.forEach(key => {
      const savedUrl = localStorage.getItem(`url-${key}`);
      const input = document.getElementById(`url-${key}`);
      if (input && savedUrl) {
        input.value = savedUrl;
      }
    });
  }

  // Toggles de visualización del Dialog Settings
  if (btnOpenSettings && settingsDialog) {
    btnOpenSettings.addEventListener('click', () => {
      loadSavedSettings();
      settingsDialog.showModal();
    });
  }

  if (btnCloseSettings && settingsDialog) {
    btnCloseSettings.addEventListener('click', () => {
      settingsDialog.close();
    });
  }

  // Resetear configuraciones
  if (btnResetSettings) {
    btnResetSettings.addEventListener('click', () => {
      const inputs = settingsDialog.querySelectorAll('input[type="url"]');
      inputs.forEach(input => input.value = '');
    });
  }

  // Guardar configuraciones en localStorage
  const settingsForm = settingsDialog ? settingsDialog.querySelector('form') : null;
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      const urls = ['sintactico', 'mini-compilador', 'automata'];
      urls.forEach(key => {
        const input = document.getElementById(`url-${key}`);
        if (input) {
          if (input.value.trim() !== '') {
            localStorage.setItem(`url-${key}`, input.value.trim());
          } else {
            localStorage.removeItem(`url-${key}`);
          }
        }
      });
      // Sincronizar APIs actuales con el iframe cargado
      injectSettingsToIframe();
    });
  }

  // Enviar configuraciones del backend al iframe utilizando postMessage
  function injectSettingsToIframe() {
    if (ovaIframe.src === 'about:blank') return;
    
    const settings = {
      theme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
      apiUrls: {
        sintactico: localStorage.getItem('url-sintactico') || 'http://localhost:8001',
        miniCompilador: localStorage.getItem('url-mini-compilador') || 'http://localhost:8002',
        automata: localStorage.getItem('url-automata') || 'http://localhost:5000'
      }
    };

    try {
      ovaIframe.contentWindow.postMessage({
        type: 'USB_PORTAL_CONFIG',
        config: settings
      }, '*');
      console.log('API config inyectada a la simulación con éxito.', settings.apiUrls);
    } catch (error) {
      console.warn('No se pudo inyectar la configuración en el iframe (CORS o iframe no cargado):', error);
    }
  }

  // ── INTEGRACIÓN DE MODALES DE DETALLE (INFORMACIÓN ACADÉMICA) ──────────────

  // Botón "Conocer Proyecto" del Hero
  if (btnAboutProject && projectAboutModal) {
    btnAboutProject.addEventListener('click', () => {
      projectAboutModal.showModal();
    });
  }

  // Botones "Información" de cada Tarjeta de OVA
  cardInfoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const ovaName = btn.getAttribute('data-ova');
      const modalId = OVA_MODAL_MAP[ovaName];
      if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.showModal();
        }
      }
    });
  });

  // Botones de cierre genéricos de los modales de detalle
  closeDetailsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.close();
        }
      }
    });
  });

  // Cerrar modales si se hace clic fuera del contenedor (en el pseudo-elemento backdrop)
  const allModals = document.querySelectorAll('dialog');
  allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
        && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        modal.close();
      }
    });
  });

  // ── CENTRO DE APRENDIZAJE (Fase 14) ───────────────────────────────────────
  if (typeof LearningHub !== 'undefined') {
    LearningHub.init();
  }

});
