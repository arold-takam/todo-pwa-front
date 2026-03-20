// src/features/task/ui/formUpdate/FormUpdate.jsx

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTaskContext } from '../../../../context/TaskContext.jsx'; // vérifie le chemin exact
import './FormUpdate.css';

export default function FormUpdate() {
    const { tasks, updateTask, fetchTasks } = useTaskContext(); // on utilise fetchTasks si besoin
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const taskId = Number(searchParams.get('id'));

    const [formData, setFormData] = useState({
        title: '',
        details: '',
        date: '',
        time: '',
        isDone: false,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ────────────────────────────────────────────────
    // 1. Chargement automatique des tâches si elles sont vides
    // ────────────────────────────────────────────────
    useEffect(() => {
        if (tasks.length === 0 && taskId) {
            fetchTasks(); // on force le chargement si on arrive directement ici
        }
    }, [tasks.length, taskId, fetchTasks]);

    // ────────────────────────────────────────────────
    // 2. Pré-remplissage une fois que les tâches sont disponibles
    // ────────────────────────────────────────────────
    useEffect(() => {
        if (taskId && tasks.length > 0) {
            const task = tasks.find((t) => t.id === taskId);

            if (task) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFormData({
                    title: task.title || '',
                    details: task.details || '',
                    date: task.date || '',
                    time: task.time || '',
                    isDone: task.done || false,
                });
                setLoading(false);
                setError(null);
            } else {
                setError('Tâche introuvable (ID non existant)');
                setLoading(false);
            }
        }
    }, [tasks, taskId]);

    // ────────────────────────────────────────────────
    // Formatage safe du time (évite le double :00)
    // ────────────────────────────────────────────────
    const formatTimeForSubmit = (timeStr) => {
        if (!timeStr) return null;
        // Si déjà au format HH:mm:ss → on garde
        if (timeStr.length === 8 && timeStr.includes(':')) return timeStr;
        // Sinon on assume HH:mm et on ajoute :00
        if (timeStr.length === 5 && timeStr.includes(':')) {
            return `${timeStr}:00`;
        }
        return null; // sécurité
    };

    // ────────────────────────────────────────────────
    // Gestion des changements de formulaire
    // ────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value, type} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'radio' ? (name === 'isDone' && value === 'true') : value,
        }));
    };

    // ────────────────────────────────────────────────
    // Soumission
    // ────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!taskId) {
            alert('ID de tâche manquant dans l’URL');
            return;
        }

        const updatedData = {
            title: formData.title.trim(),
            details: formData.details.trim(),
            date: formData.date || null,
            time: formatTimeForSubmit(formData.time),
            isDone: formData.isDone,
        };

        try {
            await updateTask(taskId, updatedData);
            alert('Tâche mise à jour avec succès !');
            navigate('/');
        } catch (err) {
            console.error('Erreur mise à jour tâche:', err);
            const msg = err.response?.data?.message || err.message || 'Erreur inconnue';
            alert(`Échec de la mise à jour : ${msg}`);
        }
    };

    // ────────────────────────────────────────────────
    // Rendu
    // ────────────────────────────────────────────────
    if (loading) {
        return <div className="loading">Chargement de la tâche en cours...</div>;
    }

    if (error) {
        return (
            <div className="error">
                {error}
                <br />
                <Link to="/">Retour à la liste</Link>
            </div>
        );
    }

    return (
        <section className="formUpdate">
            <div className="filter">
                <form className="updateTask" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="title"
                        placeholder="Titre de la tâche"
                        className="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="details"
                        placeholder="Détails de la tâche"
                        className="details"
                        value={formData.details}
                        onChange={handleChange}
                    />

                    <div className="dateTime">
                        <input
                            type="date"
                            name="date"
                            className="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                        <input
                            type="time"
                            name="time"
                            className="time"
                            value={formData.time}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="status">
                        <b>STATUT :</b>
                        <div className="taskDone">
                            <input
                                type="radio"
                                name="isDone"
                                id="done"
                                value="true"
                                checked={formData.isDone === true}
                                onChange={handleChange}
                            />
                            <label htmlFor="done">Terminée</label>
                        </div>
                        <div className="taskRunning">
                            <input
                                type="radio"
                                name="isDone"
                                id="notDone"
                                value="false"
                                checked={formData.isDone === false}
                                onChange={handleChange}
                            />
                            <label htmlFor="notDone">En cours</label>
                        </div>
                    </div>

                    <div className="cta">
                        <Link to="/" className="back">Retour</Link>
                        <button type="submit" className="updateIt">
                            Mettre à jour
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}