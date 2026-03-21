// src/utils/offlineSync.js
// Ce fichier n'est PAS un hook React, c'est un utilitaire global
// Il est appelé UNE SEULE FOIS au démarrage de l'application

import { syncPendingTasks } from '../features/task/application/useTasks.js'; // ajuste le chemin si besoin

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

    // Sync immédiate si déjà online au démarrage
    if (navigator.onLine) {
        console.log('Déjà online au démarrage → sync immédiate');
        syncPendingTasks();
    }

    isInitialized = true;
}