// src/utils/initOfflineSync.js

let isInitialized = false;

/**
 * Initialise les listeners réseau globaux UNE SEULE FOIS.
 * Émet un CustomEvent 'app:sync-requested' que TaskContext écoute.
 * Affiche/masque une bannière offline dans le DOM.
 */
export function initOfflineSync() {
    if (isInitialized) return;
    console.log('[OfflineSync] Initialisation');

    // ── Bannière offline ────────────────────────────────────────
    const showBanner = (msg, color = '#00595e') => {
        let banner = document.getElementById('offline-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            Object.assign(banner.style, {
                position: 'fixed', top: '0', left: '0', right: '0',
                padding: '0.6rem 1rem', textAlign: 'center',
                fontWeight: '600', fontSize: '0.9rem',
                zIndex: '9999', transition: 'opacity 0.4s',
                color: 'white',
            });
            document.body.prepend(banner);
        }
        banner.textContent = msg;
        banner.style.background = color;
        banner.style.opacity = '1';
        banner.style.display = 'block';
    };

    const hideBanner = (delay = 3000) => {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            setTimeout(() => { banner.style.opacity = '0'; }, delay);
            setTimeout(() => { banner.style.display = 'none'; }, delay + 400);
        }
    };

    // ── Handlers réseau ─────────────────────────────────────────
    const handleOnline = () => {
        console.log('[OfflineSync] 🌐 Réseau revenu → sync lancée');
        showBanner('🌐 Réseau restauré — synchronisation en cours…', '#007a82');
        window.dispatchEvent(new CustomEvent('app:sync-requested'));
        hideBanner(4000);
    };

    const handleOffline = () => {
        console.log('[OfflineSync] 📴 Mode hors-ligne');
        showBanner('📴 Hors-ligne — modifications sauvegardées localement', '#c0392b');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ── Sync au retour de visibilité de page ────────────────────
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
            console.log('[OfflineSync] Page redevenue visible + online → sync');
            window.dispatchEvent(new CustomEvent('app:sync-requested'));
        }
    });

    // ── Bannière initiale si déjà offline ───────────────────────
    if (!navigator.onLine) {
        showBanner('📴 Hors-ligne — données locales uniquement', '#c0392b');
    }

    isInitialized = true;
}