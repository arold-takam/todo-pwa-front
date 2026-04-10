import apiClient from './apiClient.js';

const USER_ID = 1; // TODO: remplacer par l'ID du UserContext après auth JWT

const isDev = import.meta.env.DEV;

export const TaskApiAdapter = {

    async getAllTasks() {
        const response = await apiClient.get(`/task/find/all/${USER_ID}`);

        if (isDev) console.log('[API] Réponse brute :', response.data);

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        if (Array.isArray(response.data)) {
            return response.data;
        }
        if (isDev) console.warn('[API] Format inattendu, retour tableau vide');
        return [];
    },

    async saveTask(taskRequest) {
        const payload = { ...taskRequest, userId: USER_ID };
        const response = await apiClient.post('/task/save', payload);
        return response.data.data;
    },

    async deleteTask(id) {
        await apiClient.delete(`/task/delete/${id}`);
    },

    async toggleStatus(id) {
        const response = await apiClient.patch(`/task/validate/${id}`);
        return response.data.data;
    },

    async updateTask(id, taskRequest) {
        const payload = { ...taskRequest, userId: USER_ID };
        const response = await apiClient.put(`/task/update/${id}`, payload);
        return response.data.data;
    },

    // ─── User endpoints ─────────────────────────────────────
    async getAllUsers() {
        const response = await apiClient.get('/user/find/all');
        if (response.data?.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    },

    async saveUser(userRequest) {
        const response = await apiClient.post('/user/save', userRequest);
        return response.data.data;
    },

    async updateUser(id, userRequest) {
        const response = await apiClient.put(`/user/update/${id}`, userRequest);
        return response.data.data;
    },

    async deleteUser(id) {
        await apiClient.delete(`/user/delete/${id}`);
    },
};