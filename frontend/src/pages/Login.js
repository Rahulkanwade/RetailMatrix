import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // <-- ADDED: Need Axios to set default headers

const API_BASE_URL = process.env.REACT_APP_API_BASE;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  console.log('Attempting login to:', `${API_BASE_URL}/login`); // Debug log

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    console.log('Response status:', response.status); // Debug log

    const data = await response.json();
    console.log('Response data:', data); // Debug log

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userEmail', data.user.email);
      
      // 🔑 CRITICAL FIX ADDED HERE: 
      // Set the default Authorization header for Axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`; //

      navigate("/dashboard");
    } else {
      throw new Error('No token received from server');
    }
  } catch (err) {
    console.error('Login error details:', err);
    setError(`Login failed: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container mt-5">
      <div className="card shadow p-4" style={{ maxWidth: "400px", margin: "0 auto" }}>
        <h2 className="text-center mb-4">Login</h2>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <button
          type="button"
          className="btn btn-link w-100 mt-3"
          onClick={() => navigate('/signup')}
          disabled={loading}
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );
}

export default Login;