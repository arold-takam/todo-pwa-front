import apiClient from './apiClient.js';

const USER_ID = 1; // temporaire – à remplacer par auth/context/user plus tard

export const TaskApiAdapter = {
    // src/infrastructure/TaskApiAdapter.js
    async getAllTasks() {
        const response = await apiClient.get(`/task/find/all/${USER_ID}`);

        console.log('[API] Réponse brute :', response.data); // ← DEBUG ici !

        // Cas 1 : wrapper ApiResponse { success: true, data: [...] }
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        // Cas 2 : directement le tableau
        if (Array.isArray(response.data)) {
            return response.data;
        }

        // Cas 3 : autre structure inattendue
        console.warn('[API] Format inattendu, retour tableau vide');
        return [];
    },

    async saveTask(taskRequest) {
        const payload = { ...taskRequest, userId: USER_ID };
        const response = await apiClient.post('/task/save', payload);
        return response.data.data;
    },

    async deleteTask(id) {
        await apiClient.delete(`/task/delete/${id}`);
        // Pas de retour utile, juste 204
    },

    async toggleStatus(id) {
        const response = await apiClient.patch(`/task/validate/${id}`);
        return response.data.data; // retourne la TaskResponseDto mise à jour
    },

    async updateTask(id, taskRequest) {
        const payload = { ...taskRequest, userId: USER_ID };
        const response = await apiClient.put(`/task/update/${id}`, payload);
        return response.data.data;
    }
};