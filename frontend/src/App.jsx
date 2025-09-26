// frontend/src/App.jsx - FULL UPDATED CODE (Add TournamentView Route)

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Import all required pages/components
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard'; 
import TournamentView from './pages/TournamentView'; // <<< NEW IMPORT
// Placeholder for other Dashboards
const CoordinatorDashboard = () => <div className="container" style={{padding: '20px', color: '#fff'}}><h1>Coordinator Dashboard</h1></div>;
const SpectatorDashboard = () => <div className="container" style={{padding: '20px', color: '#fff'}}><h1>Spectator Dashboard (Public View)</h1></div>;


// --- PROTECTED ROUTE COMPONENT (Unchanged) ---
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
            default: path = '/';
        }
        alert(`Access denied. You are logged in as ${userRole}.`);
        return <Navigate to={path} replace />;
    }

    return children;
};
// ---------------------------------------------


// The entire Login/Registration logic is kept here for simplicity
const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [regRole, setRegRole] = useState('admin');
    const [regId, setRegId] = useState('');
    const [regError, setRegError] = useState('');

    const navigate = useNavigate(); 

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setRegError('');
    };

    const getPlaceholder = (role) => {
        const prefix = role.charAt(0).toUpperCase();
        return `${prefix}####`;
    };

    const validateId = (id, role) => {
        const prefix = role.charAt(0).toUpperCase();
        const regex = new RegExp(`^${prefix}\\d{4}$`);
        return regex.test(id);
    };

    const handleRegistration = async (e) => {
        e.preventDefault();
        setRegError('');
        const username = e.target['reg-username'].value;
        const uniqueId = e.target['reg-id'].value;
        const password = e.target['reg-password'].value;
        const role = e.target['reg-role'].value;

        if (!username || !uniqueId || !password) {
            setRegError('Please fill in all fields.');
            return;
        }

        if (!validateId(uniqueId, role)) {
            setRegError(`ID must start with a '${role.charAt(0).toUpperCase()}' followed by 4 digits.`);
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', {
                username,
                uniqueId,
                password,
                role,
            });
            console.log('Registration successful:', res.data);
            alert('Registration successful! Please sign in.');
            toggleForm();
        } catch (err) {
            setRegError(err.response?.data?.msg || 'Registration failed. Please try again.');
            console.error(err.response?.data);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setRegError('');
        const uniqueId = e.target['uniqueId'].value; 
        const password = e.target['password'].value;

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                username: uniqueId, 
                password,
            });
            
            const { token, user } = res.data; 
            
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.role); 
            localStorage.setItem('username', user.username); 

            alert(`Welcome, ${user.username}! Logging in as ${user.role}.`);
            
            switch (user.role) {
                case 'admin':
                    navigate('/admin-dashboard');
                    break;
                case 'manager':
                    navigate('/manager-dashboard');
                    break;
                case 'coordinator':
                    navigate('/coordinator-dashboard');
                    break;
                case 'spectator':
                    navigate('/spectator-dashboard');
                    break;
                default:
                    navigate('/');
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
                    <img src="/logo.png" alt="GameON Logo" className="logo" />
                    <h1 className="welcome-title">
                        GAME<span>ON</span>
                    </h1>
                    <p className="tagline">Smart Sports Tournament Management</p>
                    <div className="quote-box">
                        <p>"Welcome to GameOn</p>
                        <p>
                            A smart and interactive platform designed to manage local sports tournaments with
                            ease. Whether you're an organizer, coordinator, manager, or spectator,
                            GameOn connects everyone with real-time updates, player stats, and seamless
                            communication."
                        </p>
                    </div>
                </div>
                <div className="login-form-container">
                    <h1 className="form-title">{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
                    <p className="form-subtitle">{isLogin ? 'Sign into your account.' : 'Join the community'}</p>
                    {isLogin ? (
                        <form onSubmit={handleLogin} key="login-form">
                            <div className="input-group">
                                <label htmlFor="uniqueId">Unique ID (e.g., A1000)</label> 
                                <input type="text" id="uniqueId" placeholder="Enter your Unique ID" /> 
                            </div>
                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" placeholder="Enter your password" />
                            </div>
                            {regError && <p className="error-message">{regError}</p>}
                            <button type="submit" className="button">Sign In</button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegistration} key="register-form">
                            <div className="input-group">
                                <label htmlFor="reg-username">Username</label>
                                <input type="text" id="reg-username" placeholder="Choose a username" />
                            </div>
                            <div className="input-group">
                                <label htmlFor="reg-id">Unique ID</label>
                                <input
                                    type="text"
                                    id="reg-id"
                                    placeholder={getPlaceholder(regRole)}
                                    value={regId}
                                    onChange={(e) => setRegId(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="reg-password">Password</label>
                                <input type="password" id="reg-password" placeholder="Create a password" />
                            </div>
                            <div className="input-group">
                                <label htmlFor="reg-role">Role</label>
                                <select
                                    id="reg-role"
                                    value={regRole}
                                    onChange={(e) => setRegRole(e.target.value)}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="coordinator">Coordinator</option>
                                    <option value="manager">Manager</option>
                                    <option value="spectator">Spectator</option>
                                </select>
                            </div>
                            {regError && <p className="error-message">{regError}</p>}
                            <button type="submit" className="button">Create Account</button>
                        </form>
                    )}
                    <p className="sign-link-text">
                        {isLogin ? 'New to GAME-ON?' : 'Already have an account?'}
                        <a onClick={toggleForm} className="sign-link">
                            {isLogin ? ' Create Account' : ' Sign In'}
                        </a>
                    </p>
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
                <Route path="/" element={<LoginPage />} />
                
                {/* ADMIN DASHBOARD ROUTE */}
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                
                {/* MANAGER DASHBOARD ROUTE */}
                <Route
                    path="/manager-dashboard"
                    element={
                        <ProtectedRoute requiredRole="manager">
                            <ManagerDashboard />
                        </ProtectedRoute>
                    }
                />
                
                {/* NEW TOURNAMENT VIEW ROUTE */}
                <Route
                    path="/tournament/:id" // <<< NEW ROUTE DEFINITION
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <TournamentView />
                        </ProtectedRoute>
                    }
                />
                
                {/* OTHER ROUTES */}
                <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
                <Route path="/spectator-dashboard" element={<SpectatorDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;