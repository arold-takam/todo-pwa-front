// src/features/task/infrastructure/apiClient.js
import axios from 'axios';

// En production (Netlify) : pointe vers https://todo-pwa-back.onrender.com/api/v1
// En développement       : pointe vers http://localhost:8080/api/v1
// La valeur est injectée par Vite depuis .env.production ou .env.development
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
    console.error('[apiClient] VITE_API_BASE_URL est vide ! Vérifie ton .env ou les secrets CI.');
}

console.log('[apiClient] Base URL utilisée :', BASE_URL);

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout de 10s pour éviter un freeze sur le plan free Render
    // (les instances Render free "dorment" après 15 min d'inactivité)
    timeout: 15000,
});

// Intercepteur de réponse : log les erreurs réseau clairement
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.warn('[apiClient] Timeout — le serveur Render est peut-être en train de démarrer (cold start ~30s). Réessaie dans quelques secondes.');
        } else if (!error.response) {
            console.warn('[apiClient] Pas de réponse réseau — mode offline ou serveur inaccessible.');
        }
        return Promise.reject(error);
    }
);

export default apiClient;