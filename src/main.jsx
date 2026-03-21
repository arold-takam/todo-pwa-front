import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import {TaskProvider} from "./context/TaskContext.jsx";
import {initOfflineSync} from "./utils/initOfflineSync.js";

// Initialise la synchro globale UNE SEULE FOIS
initOfflineSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
	  <BrowserRouter>
		  <TaskProvider>
				  <App />
		  </TaskProvider>
	  </BrowserRouter>
  </StrictMode>
)
