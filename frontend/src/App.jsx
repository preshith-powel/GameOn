// frontend/src/App.jsx - FINAL REFACTORED CODE (With Login Bug Fix Applied)

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// --- IMPORT PAGES ---
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard'; 
import TournamentViewPage from './pages/TournamentViewPage'; 
import CoordinatorDashboard from './pages/CoordinatorDashboard';

// --- NEW COMPONENT IMPORTS ---
import LoginPage from './pages/Login'; 
import RegisterPage from './pages/Register';
// -----------------------------


// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        let path = '/';
        switch (userRole) {
            case 'admin': path = '/admin-dashboard'; break;
            case 'manager': path = '/manager-dashboard'; break;
            case 'coordinator': path = '/coordinator-dashboard'; break;
            default: path = '/';
        }
        console.warn(`Access denied. Navigating to ${userRole} dashboard.`);
        return <Navigate to={path} replace />;
    }

    return children;
};
// ---------------------------------------------


// The AUTHENTICATION WRAPPER COMPONENT
const AuthWrapper = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [regError, setRegError] = useState('');

    const navigate = useNavigate(); 
    
    // Toggles between Login and Register forms
    const toggleForm = () => {
        setIsLogin(!isLogin);
        setRegError('');
    };

    // --- Login Handler (Contains the CRITICAL FIX) ---
    const handleLogin = async (uniqueId, password) => {
        setRegError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                // FIX: This line now sends the correct key 'uniqueId' to the backend
                uniqueId: uniqueId, 
                password,
            });
            
            const { token, user } = res.data; 
            
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.role); 
            localStorage.setItem('username', user.username); 
            localStorage.setItem('userId', user.id); // CRITICAL: Store MongoDB ID

            alert(`Welcome, ${user.username}! Logging in as ${user.role}.`);
            
            // Redirect based on user role
            switch (user.role) {
                case 'admin': navigate('/admin-dashboard'); break;
                case 'manager': navigate('/manager-dashboard'); break;
                case 'coordinator': navigate('/coordinator-dashboard'); break;
                case 'spectator': navigate('/spectator-dashboard'); break;
                default: navigate('/');
            }

        } catch (err) {
            setRegError(err.response?.data?.msg || 'Login failed. Invalid credentials.');
            console.error(err.response?.data);
        }
    };
    
    // --- JSX RENDER ---
    return (
        <div className="container">
            <div className="outer-card">
                <div className="welcome-panel">
                    {/* ... (Welcome panel JSX removed for brevity, kept in CSS) ... */}
                    <img src="/logo.png" alt="GameON Logo" className="logo" />
                    <h1 className="welcome-title">GAME<span>ON</span></h1>
                    <p className="tagline">Smart Sports Tournament Management</p>
                    <div className="quote-box">
                        <p>"Welcome to GameOn: A smart and interactive platform..."</p>
                    </div>
                </div>
                <div className="login-form-container">
                    {isLogin ? (
                        <LoginPage handleLogin={handleLogin} toggleForm={toggleForm} regError={regError} />
                    ) : (
                        <RegisterPage toggleForm={toggleForm} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
function App() {
    return (
        <Router>
            <Routes>
                {/* Auth Wrapper handles Login/Register logic and UI */}
                <Route path="/" element={<AuthWrapper />} /> 
                
                {/* DASHBOARD ROUTES (Protected) */}
                <Route
                    path="/admin-dashboard"
                    element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
                />
                
                <Route
                    path="/manager-dashboard"
                    element={<ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>}
                />
                
                <Route
                    path="/coordinator-dashboard"
                    element={<ProtectedRoute requiredRole="coordinator"><CoordinatorDashboard /></ProtectedRoute>}
                />
                
                {/* SPECTATOR DASHBOARD ROUTE (Public/Placeholder) */}
                <Route path="/spectator-dashboard" element={<AuthWrapper />} /> 

                {/* TOURNAMENT VIEW ROUTE (PUBLIC access for spectators/fans) */}
                <Route
                    path="/tournament/:id" 
                    element={<TournamentViewPage />} // NO ProtectedRoute
                />
            </Routes>
        </Router>
    );
}

export default App;