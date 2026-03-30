// src/features/task/application/useTasks.js

import { useState, useEffect } from 'react';
import { TaskApiAdapter } from '../infrastructure/TaskApiAdapter.js';
import db from "../../../../db.js";

const loadTasks = async (setTasks, setLoading, setError) => {
    if (!setTasks) return;
    setLoading(true);
    try {
        const apiTasks = await TaskApiAdapter.getAllTasks();
        const validated = apiTasks || [];
        await db.tasks.clear();
        await db.tasks.bulkPut(validated.map(t => ({
            ...t,
            done: t.done ?? t.isDone ?? false,
            synced: true,
            updatedAt: Date.now()
        })));
        setTasks(validated);
    } catch (err) {
        console.error('Chargement API KO, fallback local', err);
        setError('Mode hors-ligne – données locales');
        const localTasks = await db.tasks.toArray();
        setTasks(localTasks ?? []);
    } finally {
        setLoading(false);
    }
};

export const syncPendingTasks = async (setTasks, setLoading, setError) => {
    const pending = await db.tasks.filter(task => task.synced === false).toArray();
    if (pending.length === 0) return;

    for (const task of pending) {
        try {
            // Cas 1 : nouvelle tâche créée offline
            if (task.tempId) {
                const created = await TaskApiAdapter.saveTask(task);
                await db.transaction('rw', db.tasks, async () => {
                    await db.tasks.where('tempId').equals(task.tempId).delete();
                    await db.tasks.put({ ...created, synced: true, updatedAt: Date.now() });
                });

                // Cas 2 : toggle offline (PATCH /validate)
            } else if (task.pendingAction === 'toggle' && typeof task.id === 'number') {
                const updatedServer = await TaskApiAdapter.toggleStatus(task.id);
                await db.tasks.put({
                    ...updatedServer,
                    synced: true,
                    pendingAction: null,
                    updatedAt: Date.now()
                });

                // Cas 3 : update classique offline (PUT /update)
            } else if (typeof task.id === 'number') {
                const updatedServer = await TaskApiAdapter.updateTask(task.id, task);
                await db.tasks.put({
                    ...updatedServer,
                    synced: true,
                    pendingAction: null,
                    updatedAt: Date.now()
                });
            }
        } catch (err) {
            console.error('Sync KO pour tâche', task.id ?? task.tempId, err);
        }
    }

    if (setTasks && setLoading && setError) {
        await loadTasks(setTasks, setLoading, setError);
    }
};

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTasks(setTasks, setLoading, setError);
    }, []);

    const handleSync = () => {
        loadTasks(setTasks, setLoading, setError);
    };

    const addTask = async (taskData) => {
        const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
        const optimisticTask = {
            ...taskData,
            id: tempId,
            tempId,
            done: taskData.done || false,
            synced: false,
            pendingAction: 'create',
            updatedAt: Date.now()
        };
        setTasks(prev => [...prev, optimisticTask]);
        await db.tasks.add(optimisticTask);

        try {
            const newTask = await TaskApiAdapter.saveTask(taskData);
            setTasks(prev => prev.map(t => (t.tempId === tempId ? { ...newTask, synced: true } : t)));
            await db.tasks.put({ ...newTask, synced: true, pendingAction: null, updatedAt: Date.now() });
            await db.tasks.where('tempId').equals(tempId).delete();
        } catch (err) {
            console.error('Erreur ajout serveur:', err);
        }
    };

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id || t.tempId === id);
        if (!task) return;

        const updatedLocal = {
            ...task,
            done: !task.done,
            synced: false,
            pendingAction: 'toggle',   // ← marqueur pour la sync
            updatedAt: Date.now()
        };
        setTasks(prev => prev.map(t => (t.id === id || t.tempId === id ? updatedLocal : t)));
        await db.tasks.put(updatedLocal);

        try {
            if (typeof id === 'number') {
                const updatedServer = await TaskApiAdapter.toggleStatus(id);
                setTasks(prev => prev.map(t => (t.id === id ? { ...updatedServer, synced: true } : t)));
                await db.tasks.put({ ...updatedServer, synced: true, pendingAction: null, updatedAt: Date.now() });
            }
        } catch (err) {
            console.error('Toggle serveur KO (sera rejoué à la sync):', err);
        }
    };

    const deleteTask = async (id) => {
        setTasks(prev => prev.filter(t => t.id !== id && t.tempId !== id));
        await db.tasks.delete(id);

        try {
            if (typeof id === 'number') {
                await TaskApiAdapter.deleteTask(id);
            }
        } catch (err) {
            console.error('Suppression serveur KO:', err);
            // Note : le delete offline n'est pas rejoué car la tâche
            // est déjà supprimée localement. À améliorer si besoin
            // avec une table "pending_deletes" dans Dexie.
        }
    };

    const updateTask = async (id, updatedData) => {
        const task = tasks.find(t => t.id === id || t.tempId === id);
        if (!task) return;

        const updatedLocal = {
            ...task,
            ...updatedData,
            synced: false,
            pendingAction: 'update',   // ← marqueur pour la sync
            updatedAt: Date.now()
        };
        setTasks(prev => prev.map(t => (t.id === id || t.tempId === id ? updatedLocal : t)));
        await db.tasks.put(updatedLocal);

        try {
            if (typeof id === 'number') {
                const updatedServer = await TaskApiAdapter.updateTask(id, updatedData);
                setTasks(prev => prev.map(t => (t.id === id ? { ...updatedServer, synced: true } : t)));
                await db.tasks.put({ ...updatedServer, synced: true, pendingAction: null, updatedAt: Date.now() });
            }
        } catch (err) {
            console.error('Update serveur KO (sera rejoué à la sync):', err);
        }
    };

    return {
        tasks: tasks ?? [],
        loading,
        error,
        setTasks,
        setLoading,
        setError,
        addTask,
        toggleTask,
        deleteTask,
        updateTask,
        syncPendingTasks: handleSync,
        fetchTasks: handleSync,
    };
}