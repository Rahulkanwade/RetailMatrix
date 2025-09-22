import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Container, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { BsCake, BsListCheck, BsCashCoin, BsWallet, BsTruck, BsCreditCard } from 'react-icons/bs';
import './Dashboard.css'; // Import the CSS file

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/profile", {
          withCredentials: true
        });
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        console.log("Auth error", err);
        setError("Failed to load user profile");
        setLoading(false);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const dashboardItems = [
    {
      title: "Cake Management",
      description: "Manage cake & pastry orders efficiently",
      icon: BsCake,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      path: "/cake-management",
      count: "24"
    },
    {
      title: "Payment Management",
      description: "Handle all payment transactions",
      icon: BsCreditCard,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      path: "/PaymentManagement",
      count: "12"
    },
    {
      title: "Lists",
      description: "Organize and manage your lists",
      icon: BsListCheck,
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      path: "/List",
      count: "8"
    },
    {
      title: "Bread Management",
      description: "Track Bread production and sales",
      icon: BsCashCoin,
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      path: "/Bread",
      count: "156"
    },
    {
      title: "Expenses",
      description: "Monitor expenses and budgets",
      icon: BsCashCoin,
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      path: "/Expense",
      count: "₹45,280"
    },
    {
      title: "Salary Management",
      description: "Handle employee salaries",
      icon: BsWallet,
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      path: "/Salary",
      count: "15"
    },
    {
      title: "Supplier Network",
      description: "Manage supplier relationships",
      icon: BsTruck,
      gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      path: "/Supplier",
      count: "8"
    },
    {
      title: "Borrowing",
      description: "Track loans and borrowings",
      icon: BsTruck,
      gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      path: "/Borrow",
      count: "3"
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center error-alert">
          <h5>Oops! Something went wrong</h5>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Navbar user={user} handleLogout={handleLogout} />
      
      <Container fluid className="dashboard-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="welcome-text">
              <h1 className="hero-title">
                Welcome Back!
              </h1>
              {user && (
                <p className="hero-subtitle">
                  Hello <Badge bg="primary" className="user-badge">{user.name || user.email}</Badge>, 
                  ready to manage your business?
                </p>
              )}
            </div>
            <div className="hero-decoration">
              <div className="floating-shape shape-1"></div>
              <div className="floating-shape shape-2"></div>
              <div className="floating-shape shape-3"></div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <Row className="g-4">
            {dashboardItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Col xs={12} sm={6} lg={4} xl={3} key={index}>
                  <div 
                    className="dashboard-card"
                    onClick={() => navigate(item.path)}
                    style={{ 
                      background: item.gradient,
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="card-content">
                      <div className="card-header">
                        <div className="icon-wrapper">
                          <IconComponent size={24} />
                        </div>
                        <div className="card-count">{item.count}</div>
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-description">{item.description}</p>
                      </div>
                    </div>
                    <div className="card-overlay"></div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stats-container">
            <h2 className="stats-title">Business Overview</h2>
            <Row className="g-4">
              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-number">8</div>
                  <div className="stat-label">Active Modules</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-number">₹1.2M</div>
                  <div className="stat-label">Monthly Revenue</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="stat-card">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Support</div>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <div className="activity-container">
            <h2 className="activity-title">Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon success">
                  <BsCake size={16} />
                </div>
                <div className="activity-content">
                  <div className="activity-text">New cake order received</div>
                  <div className="activity-time">2 minutes ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon warning">
                  <BsWallet size={16} />
                </div>
                <div className="activity-content">
                  <div className="activity-text">Salary payment processed</div>
                  <div className="activity-time">1 hour ago</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon info">
                  <BsTruck size={16} />
                </div>
                <div className="activity-content">
                  <div className="activity-text">New supplier registered</div>
                  <div className="activity-time">3 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Dashboard;