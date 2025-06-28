import React from 'react';
import CodeEditorPage from './pages/CodeEditorPage';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';


function App() {
    return (<div className="App">
        <Router>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/registration" element={<RegisterPage/>}/>
                <Route path="/codeEditor/:roomId" element={<CodeEditorPage/>}/>
                <Route path="/profile" element={<ProfilePage/>}/>
            </Routes>
        </Router>
    </div>);
}

export default App;
