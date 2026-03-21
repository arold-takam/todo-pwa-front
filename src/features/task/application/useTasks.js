// src/application/useTasks.js
import { useState, useEffect } from 'react';
import { TaskApiAdapter } from '../infrastructure/TaskApiAdapter.js';
import db from "../../../../db.js";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTasks();

        // 1. Synchronisation quand on repasse online
        const handleOnline = () => {
            console.log('🌐 Réseau revenu → synchronisation automatique');
            syncPendingTasks();  // ← APPELLE LA SYNC ICI
        };
        window.addEventListener('online', handleOnline);

        // 2. Optionnel : sync immédiat au montage si déjà online
        if (navigator.onLine) {
            console.log('Déjà online au montage → sync immédiate');
            syncPendingTasks();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const loadTasks = async () => {
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
            setError('Mode hors-ligne – données locales');
            const localTasks = await db.tasks.toArray();
            setTasks(localTasks ?? []);
            console.error('Error: ', err);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (taskData) => {
        const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
        const optimisticTask = { ...taskData, id: tempId, tempId, done: taskData.done || false, synced: false, updatedAt: Date.now() };
        setTasks(prev => [...prev, optimisticTask]);
        await db.tasks.add(optimisticTask);
        try {
            const newTask = await TaskApiAdapter.saveTask(taskData);
            setTasks(prev => prev.map(t => (t.tempId === tempId ? { ...newTask, synced: true } : t)));
            await db.tasks.put({ ...newTask, synced: true, updatedAt: Date.now() });
            await db.tasks.where('tempId').equals(tempId).delete();
        } catch (err) { console.error('Erreur ajout', err); }
    };

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id || t.tempId === id);
        if (!task) return;
        const updatedLocal = { ...task, done: !task.done, synced: false, updatedAt: Date.now() };
        setTasks(prev => prev.map(t => (t.id === id || t.tempId === id ? updatedLocal : t)));
        await db.tasks.put(updatedLocal);
        try {
            if (typeof id === 'number') {
                const updatedServer = await TaskApiAdapter.toggleStatus(id);
                setTasks(prev => prev.map(t => (t.id === id ? { ...updatedServer, synced: true } : t)));
                await db.tasks.put({ ...updatedServer, synced: true, updatedAt: Date.now() });
            }
        } catch (err) { console.error('Toggle KO', err); }
    };

    // --- LES NOUVELLES FONCTIONS ---

    const deleteTask = async (id) => {
        // 1. UI Optimiste
        setTasks(prev => prev.filter(t => t.id !== id && t.tempId !== id));
        // 2. Local
        await db.tasks.delete(id);
        // 3. Serveur
        try {
            if (typeof id === 'number') {
                await TaskApiAdapter.deleteTask(id);
            }
        } catch (err) {
            console.error('Suppression serveur KO', err);
            // On pourrait marquer la tâche comme "à supprimer" dans une table de log offline
        }
    };

    const updateTask = async (id, updatedData) => {
        const task = tasks.find(t => t.id === id || t.tempId === id);
        if (!task) return;
        const updatedLocal = { ...task, ...updatedData, synced: false, updatedAt: Date.now() };
        setTasks(prev => prev.map(t => (t.id === id || t.tempId === id ? updatedLocal : t)));
        await db.tasks.put(updatedLocal);
        try {
            if (typeof id === 'number') {
                const updatedServer = await TaskApiAdapter.updateTask(id, updatedData);
                setTasks(prev => prev.map(t => (t.id === id ? { ...updatedServer, synced: true } : t)));
                await db.tasks.put({ ...updatedServer, synced: true, updatedAt: Date.now() });
            }
        } catch (err) { console.error('Update serveur KO', err); }
    };

    const syncPendingTasks = async () => {
        const pending = await db.tasks.where('synced').equals(false).toArray();
        if (pending.length === 0) return;
        for (const task of pending) {
            try {
                if (task.tempId) {
                    const created = await TaskApiAdapter.saveTask(task);
                    await db.tasks.put({ ...created, synced: true });
                    await db.tasks.where('tempId').equals(task.tempId).delete();
                } else {
                    await TaskApiAdapter.updateTask(task.id, task);
                    await db.tasks.put({ ...task, synced: true });
                }
            } catch (err) { console.error('Sync KO', err); }
        }
        loadTasks();
    };

    return {
        tasks: tasks ?? [],
        loading,
        error,
        addTask,
        toggleTask,
        deleteTask, // <--- AJOUTÉ
        updateTask, // <--- AJOUTÉ
        syncPendingTasks
    };
}