// frontend/src/pages/Register.jsx

import React, { useState } from 'react';
import axios from 'axios';

// Helper functions (copied from original App.jsx)
const getPlaceholder = (role) => {
    const prefix = role.charAt(0).toUpperCase();
    return `${prefix}####`;
};

const validateId = (id, role) => {
    const prefix = role.charAt(0).toUpperCase();
    const regex = new RegExp(`^${prefix}\\d{4}$`);
    return regex.test(id);
};


const RegisterPage = ({ toggleForm }) => {
    const [regRole, setRegRole] = useState('admin');
    const [regId, setRegId] = useState('');
    const [regError, setRegError] = useState('');
    
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
            toggleForm(); // Switch back to login form
        } catch (err) {
            setRegError(err.response?.data?.msg || 'Registration failed. Please try again.');
            console.error(err.response?.data);
        }
    };
    
    return (
        <form onSubmit={handleRegistration} key="register-form">
            <h1 className="form-title">Create an Account</h1>
            <p className="form-subtitle">Join the community</p>

            <div className="input-group">
                <label htmlFor="reg-username">Username</label>
                <input type="text" id="reg-username" placeholder="Choose a username" required />
            </div>
            <div className="input-group">
                <label htmlFor="reg-id">Unique ID</label>
                <input
                    type="text"
                    id="reg-id"
                    placeholder={getPlaceholder(regRole)}
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label htmlFor="reg-password">Password</label>
                <input type="password" id="reg-password" placeholder="Create a password" required />
            </div>
            <div className="input-group">
                <label htmlFor="reg-role">Role</label>
                <select
                    id="reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    required
                >
                    <option value="admin">Admin</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="manager">Manager</option>
                    <option value="spectator">Spectator</option>
                </select>
            </div>
            
            {regError && <p className="error-message">Error: {regError}</p>}
            
            <button type="submit" className="button">Create Account</button>
            <p className="sign-link-text">
                Already have an account?
                <a onClick={toggleForm} className="sign-link"> Sign In</a>
            </p>
        </form>
    );
};

export default RegisterPage;