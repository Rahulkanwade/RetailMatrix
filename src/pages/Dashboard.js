import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { BsCake, BsListCheck, BsCashCoin, BsWallet, BsTruck } from 'react-icons/bs';

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
      description: "Manage cake & pastry orders",
      icon: BsCake,
      color: "text-primary",
      bgColor: "bg-primary-subtle",
      path: "/cake-management"
    },
    {
      title: "PaymentManagement",
      description: "Manage cake & pastry orders",
      icon: BsCake,
      color: "text-primary",
      bgColor: "bg-primary-subtle",
      path: "/PaymentManagement"
    },
    {
      title: "List",
      description: "Manage your lists",
      icon: BsListCheck,
      color: "text-success",
      bgColor: "bg-success-subtle",
      path: "/List"
    },
    {
      title: "Expense",
      description: "Manage expenses and borrowing",
      icon: BsCashCoin,
      color: "text-danger",
      bgColor: "bg-danger-subtle",
      path: "/Expense"
    },
    {
      title: "Salary",
      description: "Manage salary and payments",
      icon: BsWallet,
      color: "text-warning",
      bgColor: "bg-warning-subtle",
      path: "/Salary"
    },
    {
      title: "Supplier",
      description: "Manage supplier information",
      icon: BsTruck,
      color: "text-info",
      bgColor: "bg-info-subtle",
      path: "/Supplier"
    },
    {
      title: "Borrow",
      description: "Manage supplier information",
      icon: BsTruck,
      color: "text-info",
      bgColor: "bg-info-subtle",
      path: "/Borrow"
    }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
      
      <Container className="mt-5">
        {/* Welcome Section */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">
            Welcome to Your Dashboard
          </h1>
          {user && (
            <p className="lead text-muted">
              Hello, <Badge bg="primary" className="fs-6">{user.name || user.email}</Badge>
            </p>
          )}
          <hr className="my-4" />
        </div>

        {/* Dashboard Cards */}
        <Row className="justify-content-center g-4">
          {dashboardItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Col xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  className="text-center shadow-sm h-100 border-0 dashboard-card"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: '15px'
                  }}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="d-flex flex-column justify-content-center p-4">
                    <div className={`${item.bgColor} rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center`} 
                         style={{ width: '70px', height: '70px' }}>
                      <IconComponent size={30} className={item.color} />
                    </div>
                    <Card.Title className="fw-bold mb-2 text-dark">
                      {item.title}
                    </Card.Title>
                    <Card.Text className="text-muted small">
                      {item.description}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Statistics or Additional Info Section */}
        <Row className="mt-5 justify-content-center">
          <Col md={8}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <Card.Body className="text-center py-4">
                <h5 className="text-muted mb-3">Quick Stats</h5>
                <Row>
                  <Col>
                    <div className="text-primary">
                      <h4 className="fw-bold">5</h4>
                      <small className="text-muted">Modules</small>
                    </div>
                  </Col>
                  <Col>
                    <div className="text-success">
                      <h4 className="fw-bold">Active</h4>
                      <small className="text-muted">Status</small>
                    </div>
                  </Col>
                  <Col>
                    <div className="text-info">
                      <h4 className="fw-bold">2024</h4>
                      <small className="text-muted">Version</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add some custom CSS for better styling */}
      <style jsx>{`
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .min-vh-100 {
          min-height: 100vh;
        }
        
        .bg-primary-subtle {
          background-color: rgba(13, 110, 253, 0.1);
        }
        
        .bg-success-subtle {
          background-color: rgba(25, 135, 84, 0.1);
        }
        
        .bg-danger-subtle {
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .bg-warning-subtle {
          background-color: rgba(255, 193, 7, 0.1);
        }
        
        .bg-info-subtle {
          background-color: rgba(13, 202, 240, 0.1);
        }
      `}</style>
    </>
  );
}

export default Dashboard;