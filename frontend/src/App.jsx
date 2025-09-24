import { useState } from 'react';
import './index.css';
import { login, register } from './services/loginService';

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin'); // Default role for registration
  const [message, setMessage] = useState('');

  const handleAuth = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      if (isRegistering) {
        const data = await register(username, password, email, role);
        setMessage(data.message);
        setIsRegistering(false); // Switch to login after successful registration
      } else {
        const data = await login(username, password, role);
        setMessage(data.message);
        console.log('Login successful:', data.user);
        // You would typically redirect the user here
      }
    } catch (error) {
      setMessage(error.message);
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="bg-[#0c342c] text-white min-h-screen flex flex-col items-center justify-center">
      
      {/* Logo Section */}
      <header className="w-full h-40 flex items-center justify-center mt-8">
        <div className="w-full text-center">
          <img src="/logo.png" alt="GameOn Logo" className="w-[150px] h-auto mx-auto animate-pulse" />
        </div>
      </header>

      {/* Auth Form Section */}
      <main className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
        <div className="bg-[#06231d] p-8 md:p-12 rounded-lg shadow-xl border border-[#10b981] max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#fcd34d]">
            {isRegistering ? 'Register for GAME-ON' : 'Welcome to GAME-ON'}
          </h1>
          <p className="text-center mb-6 text-gray-400">
            {isRegistering ? 'Create your new account.' : 'Sign in to your account.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your password"
                required
              />
            </div>
            {/* Role dropdown is now always visible */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="admin">Admin</option>
                <option value="coordinator">Coordinator</option>
                <option value="manager">Manager</option>
                <option value="spectator">Spectator</option>
              </select>
            </div>
            {isRegistering && (
              <>
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </>
            )}
            <div className="flex items-center justify-between mt-6">
              <button
                type="submit"
                className="bg-[#10b981] hover:bg-[#059669] text-[#0c342c] font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition duration-300 w-full"
              >
                {isRegistering ? 'Register' : 'Login'}
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-4 p-3 rounded text-center text-sm" style={{ backgroundColor: '#1e293b', color: '#f1f5f9' }}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <span className="text-gray-400">
              {isRegistering ? 'Already have an account?' : 'Haven\'t registered yet?'}
            </span>
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[#fcd34d] hover:text-[#fbbf24] font-bold ml-2 transition duration-300"
            >
              {isRegistering ? 'Login here' : 'Register here'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
