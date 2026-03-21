import {useTasks} from "../features/task/application/useTasks.js";
import {useEffect} from "react";


export function useOfflineSync() {
    const { syncPendingTasks } = useTasks();

    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Réseau revenu → synchro AUTO lancée');
            syncPendingTasks();
        };

        const handleOffline = () => {
            console.log('📴 Mode hors-ligne détecté');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Sync immédiate si déjà online au montage
        if (navigator.onLine) {
            console.log('Déjà online au montage → sync immédiate');
            syncPendingTasks();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncPendingTasks]);
}