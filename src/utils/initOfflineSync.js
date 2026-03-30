// src/utils/initOfflineSync.js
// Rôle : écouter les événements réseau et émettre un signal de sync
// L'UI (TaskContext) écoute ce signal et recharge les données

let isInitialized = false;

export function initOfflineSync() {
    if (isInitialized) {
        console.log('offlineSync déjà initialisé → skip');
        return;
    }

    console.log('Initialisation offlineSync globale');

    const handleOnline = () => {
        console.log('🌐 Réseau revenu → signal de sync émis');
        // On émet un CustomEvent que le contexte React va écouter
        window.dispatchEvent(new CustomEvent('app:sync-requested'));
    };

    const handleOffline = () => {
        console.log('📴 Mode hors-ligne détecté');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    isInitialized = true;
}