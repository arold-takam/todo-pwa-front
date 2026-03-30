import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormAdd.css';
import { useTaskContext } from '../../../../context/TaskContext.jsx';

export default function FormAdd() {
    const { addTask } = useTaskContext();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isDone, setIsDone] = useState(false);

    const formatTimeForSubmit = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':');
        if (!hours || !minutes) return null;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const taskData = {
            title: title.trim(),
            details: details.trim(),
            date: date || null,
            time: formatTimeForSubmit(time),
            done: isDone,
        };

        try {
            await addTask(taskData);
            alert('Tâche ajoutée avec succès !');
            navigate('/');
        } catch (err) {
            console.error('Erreur ajout tâche', err);
            const msg = err.response?.data?.message || err.message || 'Erreur serveur';
            alert(`Échec de l'ajout : ${msg}`);
        }
    };

    return (
        <section className="formAdd">
            <div className="filter">
                <form className="addTask" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter the task title"
                        className="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="Enter the task details"
                        className="details"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />
                    <div className="dateTime">
                        <input
                            type="date"
                            className="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <input
                            type="time"
                            className="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                    <div className="status">
                        <b>STATUS:</b>
                        <div className="taskDone">
                            <input
                                type="radio"
                                name="statusTask"
                                id="done"
                                checked={isDone}
                                onChange={() => setIsDone(true)}
                            />
                            <label htmlFor="done">DONE</label>
                        </div>
                        <div className="taskRunning">
                            <input
                                type="radio"
                                name="statusTask"
                                id="notDone"
                                checked={!isDone}
                                onChange={() => setIsDone(false)}
                            />
                            <label htmlFor="notDone">NOT DONE</label>
                        </div>
                    </div>
                    <div className="cta">
                        <Link to="/" className="back">BACK</Link>
                        <button type="submit" className="addIt">ADD IT</button>
                    </div>
                </form>
            </div>
        </section>
    );
}