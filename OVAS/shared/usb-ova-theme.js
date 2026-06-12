/**
 * USB OVA Theme Manager
 * Sincroniza tema claro/oscuro con el Portal USB (iframe).
 *
 * Eventos soportados:
 *   - USB_THEME_CHANGED  { theme: 'light' | 'dark' }
 *   - USB_PORTAL_CONFIG  { config: { theme: 'light' | 'dark', ... } }
 *
 * Uso en OVA (fases posteriores):
 *   <script src="../../shared/usb-ova-theme.js"></script>
 *   <script>USB_OVA_THEME.init();</script>
 */
const USB_OVA_THEME = {
  STORAGE_KEY: 'theme',
  LIGHT_CLASS: 'usb-ova-light',
  ROOT_CLASS: 'usb-ova-root',

  /** @returns {'light'|'dark'} */
  getTheme() {
    return document.documentElement.classList.contains(this.LIGHT_CLASS) ? 'light' : 'dark';
  },

  /**
   * Aplica tema en <html>.
   * @param {'light'|'dark'|string} theme
   * @param {boolean} [persist=false] — guardar en localStorage (solo si la OVA se abre standalone)
   */
  apply(theme, persist = false) {
    const root = document.documentElement;
    root.classList.add(this.ROOT_CLASS);

    if (theme === 'light') {
      root.classList.add(this.LIGHT_CLASS);
    } else {
      root.classList.remove(this.LIGHT_CLASS);
    }

    root.setAttribute('data-usb-theme', theme === 'light' ? 'light' : 'dark');

    if (persist) {
      try {
        localStorage.setItem(this.STORAGE_KEY, theme === 'light' ? 'light' : 'dark');
      } catch {
        /* storage bloqueado */
      }
    }

    window.dispatchEvent(new CustomEvent('usb-ova-theme-changed', {
      detail: { theme: this.getTheme() }
    }));
  },

  /** Lee localStorage (misma clave que el portal) */
  readStoredTheme() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    return 'dark';
  },

  setupPortalListeners() {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'USB_THEME_CHANGED' && data.theme) {
        this.apply(data.theme);
        return;
      }

      if (data.type === 'USB_PORTAL_CONFIG' && data.config?.theme) {
        this.apply(data.config.theme);
      }
    });
  },

  /**
   * Inicializa el theme manager.
   * @param {object} [options]
   * @param {boolean} [options.useStoredTheme=true] — usar localStorage al cargar standalone
   * @param {boolean} [options.listenPortal=true] — escuchar postMessage del portal
   */
  init(options = {}) {
    const {
      useStoredTheme = true,
      listenPortal = true
    } = options;

    document.documentElement.classList.add(this.ROOT_CLASS);

    if (useStoredTheme) {
      this.apply(this.readStoredTheme());
    } else {
      this.apply('dark');
    }

    if (listenPortal) {
      this.setupPortalListeners();
    }
  }
};

if (typeof window !== 'undefined') {
  window.USB_OVA_THEME = USB_OVA_THEME;
}
