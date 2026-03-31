import { useState, useEffect, useCallback } from 'react';
import { TaskApiAdapter } from '../../task/infrastructure/TaskApiAdapter.js';

export function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await TaskApiAdapter.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error('Erreur chargement users:', err);
            setError('Impossible de charger les utilisateurs.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const addUser = async (userData) => {
        try {
            const newUser = await TaskApiAdapter.saveUser(userData);
            setUsers(prev => [...prev, newUser]);
            return newUser;
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la création';
            throw new Error(msg);
        }
    };

    const updateUser = async (id, userData) => {
        try {
            const updated = await TaskApiAdapter.updateUser(id, userData);
            setUsers(prev => prev.map(u => u.id === id ? updated : u));
            return updated;
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la mise à jour';
            throw new Error(msg);
        }
    };

    const deleteUser = async (id) => {
        try {
            await TaskApiAdapter.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la suppression';
            throw new Error(msg);
        }
    };

    return { users, loading, error, fetchUsers, addUser, updateUser, deleteUser };
}