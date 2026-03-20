import userProfile from '../../../../assets/profile-7.jpg';
import filterMenu from '../../../../assets/filtMenu.png';
import Triangle from '../../../../assets/Triangle.png';
import more from '../../../../assets/more.png';
import deleteIcon from '../../../../assets/delete.png';
import './Home.css';
import { Link } from 'react-router-dom';
import { useTaskContext } from '../../../../context/TaskContext.jsx';
import { useState } from 'react';

export default function Home() {
	const { tasks, loading, toggleTask, deleteTask } = useTaskContext();
	const [detailHidden, setDetailHidden] = useState({});
	const [filter, setFilter] = useState("all");
	const [sortOrder, setSortOrder] = useState("recent");

	const isOffLine = !navigator.onLine;

	const toggleDetails = (id) => {
		setDetailHidden((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const processedTasks = (() => {
		if (!Array.isArray(tasks)) {
			console.error('tasks n’est PAS un tableau ! Valeur actuelle :', tasks);
			return [];
		}
		return tasks
			.filter((t) => {
				if (filter === "done") return t?.done;
				if (filter === "running") return !t?.done;
				return true;
			})
			.sort((a, b) => {
				const dateA = a?.date ? new Date(`${a.date}T${a.time || '00:00:00'}`) : new Date(0);
				const dateB = b?.date ? new Date(`${b.date}T${b.time || '00:00:00'}`) : new Date(0);
				return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
			})
	})();

	if (loading) return <div className="loading">Chargement...</div>;

	return (
		<section className="homePage">
			{isOffLine && (
				<div style={{
					background: '#00595e',
					color: 'white',
					padding: '1rem',
					textAlign: 'center',
					fontWeight: 'bold',
					position: 'sticky',
					top: '0',
					zIndex: '100',
				}}>
					Mode hors-ligne – Données locales uniquement (pas de synchronisation).
				</div>
			)}
			<header>
				<Link to="/" className="homeLink">ToDo PWA</Link>
				<img src={userProfile} alt="User Profile" className="profilePic" />
			</header>
			<section className="manageZone">
				<div className="filterSort">
					<div className="filter">
						<img src={filterMenu} alt="Filter" className="filterIcon" />
						<ul className="filterBtn">
							<li>
								<button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
									ALL
								</button>
							</li>
							<li>
								<button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>
									DONE
								</button>
							</li>
							<li>
								<button className={filter === "running" ? "active" : ""} onClick={() => setFilter("running")}>
									RUNNING
								</button>
							</li>
						</ul>
					</div>

					<div className="sort">
						<ul className="sortBtn">
							<li className={sortOrder === "recent" ? "active" : ""} onClick={() => setSortOrder("recent")}>
								RECENT
							</li>
							<li className={sortOrder === "old" ? "active" : ""} onClick={() => setSortOrder("old")}>
								OLD
							</li>
						</ul>
						<img src={Triangle} alt="Sort" className="triangleIcon" />
					</div>
				</div>

				<Link to="/add/task" className="add">
					<p>ADD NEW TASK</p>
					<img src={more} alt="Add" />
				</Link>
			</section>
			<main>
				<ul className="taskList">
					{processedTasks.length === 0 ? (
						<p>Aucune tâche ne correspond.</p>
					) : (
						processedTasks.map((task) => (
							<li key={task.id}>
								<div className="up">
									<button
										type="button"
										className={`status ${task.done ? 'done' : 'pending'}`}
										onClick={() => toggleTask(task.id)}
									>
										{task.done ? '✓' : ''}
									</button>
									<h1 onClick={() => toggleDetails(task.id)}>{task.title}</h1>
									<button type="button" className="deleteTask" onClick={() => deleteTask(task.id)}>
										<img src={deleteIcon} alt="Delete" className="deleteIcon" />
									</button>
								</div>

								<div className={`middle ${detailHidden[task.id] ? 'active' : ''}`}>
									<div className="details">
										<p>{task.details || 'Pas de détails'}</p>
									</div>
									<div className="dateTime">
										<div className="date">
											<b>Date: </b>
											<i>{task.date || 'N/A'}</i>
										</div>
										<div className="time">
											<b>Heure: </b>
											<i>{task.time || 'N/A'}</i>
										</div>
									</div>
								</div>

								<div className={`down ${detailHidden[task.id] ? 'active' : ''}`}>
									<Link to={`/update/task?id=${task.id}`} className="update">
										UPDATE
									</Link>
									<button type="button" className="close" onClick={() => toggleDetails(task.id)}>
										CLOSE
									</button>
								</div>
							</li>
						))
					)}
				</ul>
			</main>
		</section>
	);
}