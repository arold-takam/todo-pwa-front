import {Routes, Route} from 'react-router-dom';
import './App.css';
import Home from "./features/task/ui/home/Home.jsx";
import FormAdd from "./features/task/ui/formAdd/FormAdd.jsx";
import FormUpdate from "./features/task/ui/formUpdate/FormUpdate.jsx";

function App() {

  return (
    <Routes>
		<Route path="/" element={<Home/>}></Route>
        <Route path={`/add/task`} element={<FormAdd/>}> </Route>
        <Route path={`/update/task`} element={<FormUpdate/>}> </Route>
    </Routes>
  )
}

export default App
