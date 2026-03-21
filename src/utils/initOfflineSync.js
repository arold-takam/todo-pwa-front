// src/utils/initOfflineSync.js
import { syncPendingTasks } from '../features/task/application/useTasks.js';  // ← chemin correct

let isInitialized = false;

export function initOfflineSync() {
    if (isInitialized) {
        console.log('offlineSync déjà initialisé → skip');
        return;
    }

    console.log('Initialisation offlineSync globale');

    const handleOnline = () => {
        console.log('🌐 Réseau revenu → synchro AUTO lancée');
        syncPendingTasks();
    };

    const handleOffline = () => {
        console.log('📴 Mode hors-ligne détecté');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
        console.log('Déjà online au démarrage → sync immédiate');
        syncPendingTasks();
    }

    isInitialized = true;
}