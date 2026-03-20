import { createContext, useContext } from 'react';
import { useTasks } from '../features/task/application/useTasks.js'; // ton hook

const TaskContext = createContext();

export function TaskProvider({ children }) {
    const taskValues = useTasks(); // le hook complet (tasks, loading, toggleTask, etc.)
    return (
        <TaskContext.Provider value={taskValues}>
            {children}
        </TaskContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskContext() {
    return useContext(TaskContext);
}