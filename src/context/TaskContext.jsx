// src/context/TaskContext.jsx
// Rôle : fournir les données et actions à toute l'app
// Écoute le signal 'app:sync-requested' pour déclencher la sync + rechargement UI

import { createContext, useContext, useEffect } from 'react';
import { useTasks, syncPendingTasks } from '../features/task/application/useTasks.js';

const TaskContext = createContext();

export function TaskProvider({ children }) {
    const taskValues = useTasks();

    useEffect(() => {
        const handleSyncRequested = async () => {
            console.log('🔄 Sync demandée depuis le contexte');
            await syncPendingTasks(
                taskValues.setTasks,
                taskValues.setLoading,
                taskValues.setError
            );
        };

        window.addEventListener('app:sync-requested', handleSyncRequested);
        return () => window.removeEventListener('app:sync-requested', handleSyncRequested);
    }, [taskValues.setTasks, taskValues.setLoading, taskValues.setError]);

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