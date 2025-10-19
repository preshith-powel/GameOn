// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ handleLogin, toggleForm, regError }) => {
    const [uniqueId, setUniqueId] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // The handleLogin function passed from App.jsx handles axios call and navigation
        handleLogin(uniqueId, password);
    };

    return (
        <form onSubmit={handleSubmit} key="login-form">
            <h1 className="form-title">Welcome Back</h1>
            <p className="form-subtitle">Sign into your account.</p>

            <div className="input-group">
                <label htmlFor="uniqueId">Unique ID (e.g., A1000)</label> 
                <input 
                    type="text" 
                    id="uniqueId" 
                    placeholder="Enter your Unique ID" 
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)}
                    required
                /> 
            </div>
            <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            
            {regError && <p className="error-message">Error: {regError}</p>} 
            
            <button type="submit" className="button">Sign In</button>
            <p className="sign-link-text">
                New to GAME-ON?
                <a onClick={toggleForm} className="sign-link"> Create Account</a>
            </p>
        </form>
    );
};

export default LoginPage;