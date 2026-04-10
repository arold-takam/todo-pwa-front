// src/context/TaskContext.jsx
// Rôle : fournir les données et actions à toute l'app
// Écoute le signal 'app:sync-requested' pour déclencher la sync + rechargement UI

import { createContext, useContext, useEffect, useRef } from 'react';
import { useTasks, syncPendingTasks } from '../features/task/application/useTasks.js';

const TaskContext = createContext();

export function TaskProvider({ children }) {
    const taskValues = useTasks();

    // On utilise un ref pour avoir accès aux setters les plus récents
    // sans recréer le listener à chaque render
    const settersRef = useRef({
        setTasks: taskValues.setTasks,
        setLoading: taskValues.setLoading,
        setError: taskValues.setError,
    });

    useEffect(() => {
        settersRef.current = {
            setTasks: taskValues.setTasks,
            setLoading: taskValues.setLoading,
            setError: taskValues.setError,
        };
    });

    useEffect(() => {
        const handleSyncRequested = async () => {
            console.log('[TaskContext] 🔄 Sync demandée');
            const { setTasks, setLoading, setError } = settersRef.current;
            await syncPendingTasks(setTasks, setLoading, setError);
        };

        window.addEventListener('app:sync-requested', handleSyncRequested);
        return () => window.removeEventListener('app:sync-requested', handleSyncRequested);
    }, []); // ← tableau vide : enregistré une seule fois

    return (
        <TaskContext.Provider value={taskValues}>
            {children}
        </TaskContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskContext() {
    return useContext(TaskContext);
}