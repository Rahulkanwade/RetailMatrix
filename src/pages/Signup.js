import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/signup', { email, password });
      alert("Signup successful! Please login.");
      navigate('/login');
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
   <div className="container mt-5">
  <div className="card p-4 shadow" style={{ maxWidth: "400px", margin: "0 auto" }}>
    <h2 className="text-center mb-4">Signup</h2>
    <form onSubmit={handleSignup}>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email address</label>
        <input
          type="email"
          id="email"
          className="form-control"
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
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary w-100">Signup</button>
      <button
        type="button"
        className="btn btn-link w-100 mt-2"
        onClick={() => navigate('/login')}
      >
        Already have an account? Login
      </button>
    </form>
  </div>
</div>

    
  );
}
export default Signup;
