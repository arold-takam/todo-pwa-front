import { useState } from 'react';
import { useUsers } from '../application/useUsers.js';
import './UserList.css';

export default function UserList() {
    const { users, loading, error, addUser, updateUser, deleteUser } = useUsers();

    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [formError, setFormError] = useState(null);

    const resetForm = () => {
        setFormData({ username: '', email: '', password: '' });
        setEditTarget(null);
        setShowForm(false);
        setFormError(null);
    };

    const openAdd = () => {
        setEditTarget(null);
        setFormData({ username: '', email: '', password: '' });
        setShowForm(true);
    };

    const openEdit = (user) => {
        setEditTarget(user);
        setFormData({ username: user.username, email: user.email, password: '' });
        setShowForm(true);
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editTarget) {
                await updateUser(editTarget.id, formData);
            } else {
                await addUser(formData);
            }
            resetForm();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet utilisateur ? Ses tâches seront aussi supprimées.')) return;
        try {
            await deleteUser(id);
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="ul-loading">Chargement des utilisateurs…</div>;
    if (error) return <div className="ul-error">{error}</div>;

    return (
        <section className="userList">
            <header className="ul-header">
                <h2>Utilisateurs</h2>
                <button className="ul-btn-add" onClick={openAdd}>+ Nouveau</button>
            </header>

            {showForm && (
                <div className="ul-overlay">
                    <form className="ul-form" onSubmit={handleSubmit}>
                        <h3>{editTarget ? 'Modifier' : 'Créer'} un utilisateur</h3>

                        {formError && <p className="ul-form-error">{formError}</p>}

                        <label>
                            Username
                            <input
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="ex: jean_dupont"
                            />
                        </label>
                        <label>
                            Email
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="ex: jean@example.com"
                            />
                        </label>
                        <label>
                            Mot de passe {editTarget && <span className="ul-hint">(laisser vide = inchangé)</span>}
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!editTarget}
                                placeholder="••••••••"
                            />
                        </label>

                        <div className="ul-form-actions">
                            <button type="button" className="ul-btn-cancel" onClick={resetForm}>Annuler</button>
                            <button type="submit" className="ul-btn-save">
                                {editTarget ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {users.length === 0 ? (
                <p className="ul-empty">Aucun utilisateur trouvé.</p>
            ) : (
                <ul className="ul-list">
                    {users.map(user => (
                        <li key={user.id} className="ul-item">
                            <div className="ul-item-info">
                                <span className="ul-username">{user.username}</span>
                                <span className="ul-email">{user.email}</span>
                                <span className="ul-id">ID: {user.id}</span>
                            </div>
                            <div className="ul-item-actions">
                                <button className="ul-btn-edit" onClick={() => openEdit(user)}>Modifier</button>
                                <button className="ul-btn-delete" onClick={() => handleDelete(user.id)}>Supprimer</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}