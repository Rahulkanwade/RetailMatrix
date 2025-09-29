import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config'; // adjust path if needed

import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Login.js
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
  await axios.post(`${API_URL}/login`, { email, password }, {
        withCredentials: true // <-- Important
      });
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };


  return (
    <div className="container mt-5">
      <div className="card shadow p-4" style={{ maxWidth: "400px", margin: "0 auto" }}>
        <h2 className="text-center mb-4">Login</h2>
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
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
        <button
          type="button"
          className="btn btn-link w-100 mt-3"
          onClick={() => navigate('/signup')}
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>

  );
}

export default Login;
