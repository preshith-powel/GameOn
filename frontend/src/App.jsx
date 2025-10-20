// frontend/src/App.jsx - FINAL CODE

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { ToastProvider, useToast } from './components/shared/ToastNotification';

// --- IMPORT PAGES ---
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard'; 
import TournamentViewPage from './pages/TournamentViewPage'; // Corrected import name

// Placeholder for other Dashboards (used in App.jsx for routing)
const CoordinatorDashboard = () => <div className="container" style={{padding: '20px', color: '#fff'}}><h1>Coordinator Dashboard</h1></div>;
const SpectatorDashboard = () => <div className="container" style={{padding: '20px', color: '#fff'}}><h1>Spectator Dashboard (Public View)</h1></div>;


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


// The entire Login/Registration logic is kept here for simplicity
const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [regRole, setRegRole] = useState('admin');
    const [regId, setRegId] = useState('');
    const [regError, setRegError] = useState('');
    const [imageError, setImageError] = useState(false); // New state for image error

    const navigate = useNavigate(); 
    const showToast = useToast();

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
            showToast('Registration successful! Please sign in.', 'success');
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
            localStorage.setItem('userId', user.id); // CRITICAL: Store MongoDB ID for filtering

            showToast(`Welcome, ${user.username}! Logging in as ${user.role}.`, 'success');
            
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

    // --- JSX RENDER (Keep original structure for animation/design) ---
    return (
        <div className="container">
            <div className="outer-card">
                <div className="welcome-panel">
                    {/* Conditional rendering for the logo */}
                    {imageError ? (
                        <h1 className="logo-text">GameON Logo</h1> // Fallback text
                    ) : (
                        <img 
                            src="/logo.png" 
                            alt="GameON Logo" 
                            className="logo" 
                            onError={() => setImageError(true)} // Set error state on image load failure
                        />
                    )}
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
    const location = useLocation();
    const nodeRef = React.useRef(null); // Create a ref
    return (
        <ToastProvider>
            <div className="route-container">
                <TransitionGroup>
                    <CSSTransition nodeRef={nodeRef} key={location.key} classNames="fade" timeout={300}>
                        <Routes location={location}>
                            <Route path="/" element={<LoginPage />} />
                            
                            {/* DASHBOARD ROUTES (Protected) */}
                            <Route
                                path="/admin-dashboard"
                                element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            
                            <Route
                                path="/manager-dashboard"
                                element={
                                    <ProtectedRoute requiredRole="manager">
                                        <ManagerDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            
                            <Route
                                path="/coordinator-dashboard"
                                element={
                                    <ProtectedRoute requiredRole="coordinator">
                                        <CoordinatorDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            
                            {/* SPECTATOR DASHBOARD ROUTE (Public) */}
                            <Route path="/spectator-dashboard" element={<SpectatorDashboard />} />

                            {/* TOURNAMENT VIEW ROUTE (PUBLIC access for spectators/fans) */}
                            <Route
                                path="/tournament/:id" 
                                element={<TournamentViewPage />} // NO ProtectedRoute
                            />
                        </Routes>
                    </CSSTransition>
                </TransitionGroup>
            </div>
        </ToastProvider>
    );
}

export default App;