import React, { useState } from 'react';

const containerStyles = {
  fontFamily: 'Inter, sans-serif',
  backgroundColor: '#0a0a0a',
  color: '#e0e0e0',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  margin: 0,
};

const outerCardStyles = {
  display: 'flex',
  backgroundColor: '#1a1a1a',
  borderRadius: '20px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  width: '1000px',
  height: '750px',
};

const welcomePanelStyles = {
  backgroundColor: '#2c2c2c',
  width: '50%',
  padding: '40px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
};

const logoStyles = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  width: '60px',
  height: '60px',
};

const welcomeTitleStyles = {
  color: '#e0e0e0',
  fontSize: '4em',
  fontWeight: 'bold',
  marginTop: '20px',
  marginBottom: '5px',
};

const taglineStyles = {
  color: '#a0a0a0',
  fontSize: '1.2em',
  marginTop: '0',
  marginBottom: '40px',
  textAlign: 'center',
};

const quoteBoxStyles = {
  backgroundColor: '#333',
  padding: '25px',
  borderRadius: '15px',
  textAlign: 'center',
  fontStyle: 'italic',
  color: '#a0a0a0',
  lineHeight: '1.5',
};

const loginFormContainerStyles = {
  width: '50%',
  padding: '30px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const formTitleStyles = {
  color: '#00ffaa',
  fontSize: '2.5em',
  fontWeight: 'bold',
  marginBottom: '5px',
  textAlign: 'center',
};

const formSubtitleStyles = {
  color: '#a0a0a0',
  fontSize: '1em',
  marginTop: 0,
  marginBottom: '20px',
  textAlign: 'center',
};

const inputGroupStyles = {
  textAlign: 'left',
  marginBottom: '15px',
};

const labelStyles = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 'bold',
  color: '#e0e0e0',
};

const inputStyles = {
  width: '100%',
  padding: '12px',
  border: '1px solid #333',
  borderRadius: '8px',
  backgroundColor: '#2c2c2c',
  color: '#e0e0e0',
  boxSizing: 'border-box',
  fontSize: '1em',
};

const selectStyles = {
  ...inputStyles,
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '15px',
  cursor: 'pointer',
};

const buttonStyles = {
  width: '100%',
  padding: '15px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#00ffaa',
  color: '#1a1a1a',
  fontSize: '1.2em',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  marginTop: '20px',
};

const signLinkTextStyles = {
  marginTop: '20px',
  fontSize: '0.9em',
  color: '#a0a0a0',
  textAlign: 'center',
};

const signLinkStyles = {
  color: '#00ffaa',
  textDecoration: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'color 0.3s ease',
};

const errorMessageStyles = {
  color: '#ff6b6b',
  fontSize: '0.85em',
  marginTop: '5px',
  textAlign: 'center',
};

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [regRole, setRegRole] = useState('admin');
  const [regId, setRegId] = useState('');
  const [regError, setRegError] = useState('');

  // Simulating a database check for unique IDs
  const existingIds = ['A1234', 'C5678', 'M9012', 'S3456'];

  const toggleForm = () => {
    setIsLogin(!isLogin);
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

  const handleRegistration = (e) => {
    e.preventDefault();
    setRegError(''); // Clear previous errors

    const username = e.target['reg-username'].value;
    const password = e.target['reg-password'].value;

    if (!username || !regId || !password) {
      setRegError('Please fill in all fields.');
      return;
    }
    
    if (!validateId(regId, regRole)) {
      setRegError(`ID must start with a '${regRole.charAt(0).toUpperCase()}' followed by 4 digits.`);
      return;
    }
    
    if (existingIds.includes(regId)) {
      setRegError('ID already exists, try another one');
    } else {
      // In a real application, you would send this data to a backend
      console.log('Account created successfully:', {
        username: username,
        id: regId,
        password: password,
        role: regRole,
      });
      // For this example, let's just switch back to the login form
      toggleForm();
    }
  };

  return (
    <div style={containerStyles}>
      <div style={outerCardStyles}>
        <div style={welcomePanelStyles}>
          <img src="/logo.png" alt="GameON Logo" style={logoStyles} />
          <h1 style={welcomeTitleStyles}>
            GAME<span style={{ color: '#00ffaa' }}>ON</span>
          </h1>
          <p style={taglineStyles}>Smart Sports Tournament Management</p>
          <div style={quoteBoxStyles}>
            <p>"Welcome to GameOn</p>
            <p>
              A smart and interactive platform designed to manage local sports tournaments with
              ease. Whether you're an organizer, coordinator, manager, or spectator,
              GameOn connects everyone with real-time updates, player stats, and seamless
              communication."
            </p>
          </div>
        </div>

        <div style={loginFormContainerStyles}>
          <h1 style={formTitleStyles}>{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
          <p style={formSubtitleStyles}>{isLogin ? 'Sign into your account.' : 'Join the community'}</p>

          {isLogin ? (
            // Login Form
            <form>
              <div style={inputGroupStyles}>
                <label htmlFor="username" style={labelStyles}>Username</label>
                <input type="text" id="username" placeholder="Enter your username" style={inputStyles} />
              </div>

              <div style={inputGroupStyles}>
                <label htmlFor="password" style={labelStyles}>Password</label>
                <input type="password" id="password" placeholder="Enter your password" style={inputStyles} />
              </div>

              <div style={inputGroupStyles}>
                <label htmlFor="role" style={labelStyles}>Role</label>
                <select id="role" style={selectStyles}>
                  <option value="admin">Admin</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="manager">Manager</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>

              <button type="submit" style={buttonStyles}>Sign In</button>
            </form>
          ) : (
            // Registration Form
            <form onSubmit={handleRegistration}>
              <div style={inputGroupStyles}>
                <label htmlFor="reg-username" style={labelStyles}>Username</label>
                <input type="text" id="reg-username" placeholder="Choose a username" style={inputStyles} />
              </div>

              <div style={inputGroupStyles}>
                <label htmlFor="reg-id" style={labelStyles}>Unique ID</label>
                <input
                  type="text"
                  id="reg-id"
                  placeholder={getPlaceholder(regRole)}
                  style={inputStyles}
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                />
              </div>
              {regError && <p style={errorMessageStyles}>{regError}</p>}

              <div style={inputGroupStyles}>
                <label htmlFor="reg-password" style={labelStyles}>Password</label>
                <input type="password" id="reg-password" placeholder="Create a password" style={inputStyles} />
              </div>

              <div style={inputGroupStyles}>
                <label htmlFor="reg-role" style={labelStyles}>Role</label>
                <select
                  id="reg-role"
                  style={selectStyles}
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="manager">Manager</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>

              <button type="submit" style={buttonStyles}>Create Account</button>
            </form>
          )}

          <p style={signLinkTextStyles}>
            {isLogin ? 'New to GAME-ON?' : 'Already have an account?'}
            <a onClick={toggleForm} style={signLinkStyles}>
              {isLogin ? ' Create Account' : ' Sign In'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
