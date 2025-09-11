import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CakeManagement from './pages/CakeManagement';
import List from './pages/List';
import Expense from './pages/Expense';
import Salary from './pages/Salary';
import Supplier from './pages/Supplier';
import About from './pages/About';
import Borrow from './pages/Borrow';
import Pav from './pages/Pav';
import PaymentManagement from './pages/PaymentManagement';
import axios from "axios";




axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:5000"; // Optional


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    // Listen for localStorage changes (like login/logout)
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/cake-management" element={<CakeManagement />} />
        <Route path="/List" element={<List />} />
        <Route path="/Expense" element={<Expense />} />
        <Route path="/Salary" element={<Salary />} />
        <Route path="/Supplier" element={<Supplier />} />
        <Route path="/About" element={<About />} />
        <Route path="/Borrow" element={<Borrow/>} />
        <Route path="/PaymentManagement" element={<PaymentManagement/>} />
        <Route path="/Pav" element={<Pav/>} />
        
      </Routes>
    </Router>
  );
}

export default App;
