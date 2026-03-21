// src/features/task/application/useTasks.js

import { useState, useEffect } from 'react';
import { TaskApiAdapter } from '../infrastructure/TaskApiAdapter.js';
import db from "../../../../db.js";

// ← Déplace loadTasks ici, au top-level (elle n'a plus besoin d'être dans le hook)
const loadTasks = async (setTasks, setLoading, setError) => {
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
        console.error('Error loading tasks:', err);
    } finally {
        setLoading(false);
    }
};

export const syncPendingTasks = async (setTasks, setLoading, setError) => {
    console.log('🔄 Début synchronisation des tâches en attente...');

    const pending = await db.tasks
        .filter(task => task.synced === false && typeof task.id === 'number')
        .toArray();

    console.log(`Tâches à synchroniser : ${pending.length}`);

    if (pending.length === 0) return;

    for (const task of pending) {
        try {
            const updatedServer = await TaskApiAdapter.updateTask(task.id, task);
            await db.tasks.put({ ...updatedServer, synced: true, updatedAt: Date.now() });
        } catch (err) {
            console.error('Sync KO pour tâche', task.id, err);
        }
    }

    // Recharge après sync
    loadTasks(setTasks, setLoading, setError);
};

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTasks(setTasks, setLoading, setError);
    }, []);

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
        } catch (err) {
            console.error('Erreur ajout serveur:', err);
        }
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
        } catch (err) {
            console.error('Toggle serveur KO:', err);
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
        } catch (err) {
            console.error('Update serveur KO:', err);
        }
    };

    return {
        tasks: tasks ?? [],
        loading,
        error,
        addTask,
        toggleTask,
        deleteTask,
        updateTask,
        syncPendingTasks
    };
}