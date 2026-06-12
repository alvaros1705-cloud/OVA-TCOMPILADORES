/**

 * FASS — Configuración de API para integración con Portal USB.

 * Patrón compatible con Fabian & Sofi / Islender & Jhoan.

 */

const API_CONFIG = {

  baseUrl: '',



  init() {

    const saved = localStorage.getItem('url-automata');

    if (saved && saved.trim()) {

      this.baseUrl = saved.trim().replace(/\/$/, '');

      return;

    }

    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {

      this.baseUrl = 'http://localhost:5000';

    }

  },



  setBaseUrl(url) {

    if (url && typeof url === 'string' && url.trim()) {

      this.baseUrl = url.trim().replace(/\/$/, '');

    }

  },



  /** Origen del backend (sin /api). */

  getOrigin() {

    if (this.baseUrl) {

      return this.baseUrl;

    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {

      return 'http://localhost:5000';

    }

    return '';

  },



  /** URL base con sufijo /api para fetch de FASS (simulator.js, algorithms.js) */

  getApiBase() {

    const origin = this.getOrigin();

    if (origin) {

      return `${origin}/api`;

    }

    return '/api';

  },



  resolve(path) {

    const normalized = path.startsWith('/') ? path : `/${path}`;

    if (normalized === '/health') {

      const origin = this.getOrigin();

      return origin ? `${origin}${normalized}` : normalized;

    }

    const apiPath = normalized.startsWith('/api') ? normalized : `/api${normalized}`;

    const origin = this.getOrigin();

    if (origin) {

      return `${origin}${apiPath}`;

    }

    return apiPath;

  },



  isLocalDev() {

    const base = (this.baseUrl || this.getOrigin() || '').toLowerCase();

    if (base.includes('localhost') || base.includes('127.0.0.1')) {

      return true;

    }

    const host = window.location.hostname;

    return !this.baseUrl && (host === 'localhost' || host === '127.0.0.1');

  }

};



let apiConnectionState = 'checking';



function setupPortalMessageListener() {

  window.addEventListener('message', (event) => {

    if (event.data?.type !== 'USB_PORTAL_CONFIG') return;

    const url = event.data.config?.apiUrls?.automata;

    if (url) {

      API_CONFIG.setBaseUrl(url);

      notifyApiUrlChanged();

    }

  });

}



async function _fetchHealth(url) {

  const response = await fetch(url, {

    method: 'GET',

    signal: AbortSignal.timeout(5000)

  });

  if (!response.ok) return false;

  const data = await response.json();

  return data?.status === 'ok' || data?.status === 'ONLINE';

}



async function probeApiConnection() {

  try {

    if (await _fetchHealth(API_CONFIG.resolve('/health'))) {

      return true;

    }

  } catch {

    /* fallback legacy */

  }



  try {

    return await _fetchHealth(`${API_CONFIG.getApiBase()}/status`);

  } catch {

    return false;

  }

}



async function updateConnectionStatus() {

  const badge = document.getElementById('api-status-badge');

  const dot = document.getElementById('api-status-dot');

  const text = document.getElementById('api-status-text');

  if (!badge || !dot || !text) return;



  badge.className = 'ova-badge-api fass-api-badge';

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

      text.textContent = 'API remota';

    }

  } else {

    apiConnectionState = 'offline';

    badge.classList.add('status-offline');

    dot.textContent = '🔴';

    text.textContent = 'Sin API — motor local activo';

  }

}



function setupFassEmbeddedMode() {

  if (window.self !== window.top) {

    document.documentElement.classList.add('fass-embedded');

    document.documentElement.setAttribute('data-ova-embedded', 'true');

  }

}



function setupFassUsbTheme() {

  if (typeof USB_OVA_THEME !== 'undefined') {

    USB_OVA_THEME.init();

  }

}



function setupFassUsbIntegration() {

  setupFassEmbeddedMode();

  setupFassUsbTheme();

}



function notifyApiUrlChanged() {

  updateConnectionStatus();

  if (typeof window._onFassApiConfigChanged === 'function') {

    window._onFassApiConfigChanged();

  }

}



window.API_CONFIG = API_CONFIG;

window.setupPortalMessageListener = setupPortalMessageListener;

window.updateConnectionStatus = updateConnectionStatus;

window.setupFassUsbIntegration = setupFassUsbIntegration;


