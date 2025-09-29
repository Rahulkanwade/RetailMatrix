import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Navbar as BootstrapNavbar, 
  Nav, 
  Container,
  NavDropdown,
} from 'react-bootstrap';
import { 
  BsHouse, 
  BsPerson, 
  BsBoxArrowRight, 
  BsList,

  BsGear,
  BsCake
} from 'react-icons/bs';

function Navbar({ user, handleLogout }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <BootstrapNavbar 
        expand="lg" 
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="navbar-custom shadow-sm sticky-top" 
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '3px solid #5a67d8',
          minHeight: '70px'
        }}
      >
        <Container fluid>
          {/* Brand/Logo */}
          <BootstrapNavbar.Brand 
            as={Link} 
            to="/dashboard" 
            className="text-white fw-bold d-flex align-items-center brand-hover"
            style={{ fontSize: '1.3rem' }}
          >
            <BsCake className="me-2" size={24} />
            Retail Matrix
          </BootstrapNavbar.Brand>

          {/* Mobile Menu Toggle */}
          <BootstrapNavbar.Toggle 
            aria-controls="basic-navbar-nav"
            className="border-0 text-white"
          >
            <BsList size={24} />
          </BootstrapNavbar.Toggle>

          {/* Navigation Items */}
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/dashboard" 
                className="text-white-50 fw-medium d-flex align-items-center px-3 nav-link-custom"
              >
                <BsHouse className="me-2" size={18} />
                Dashboard
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/About" 
                className="text-white-50 fw-medium d-flex align-items-center px-3 nav-link-custom"
              >
                <BsHouse className="me-2" size={18} />
               About
              </Nav.Link>

            </Nav>

            {/* User Section */}
            {user && (
              <Nav className="ms-auto">
         

                {/* User Dropdown */}
                <NavDropdown
                  title={
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle bg-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: '32px', height: '32px' }}
                      >
                        <BsPerson size={20} className="text-primary" />
                      </div>
                      <div className="d-flex flex-column align-items-start">
                        <span className="small fw-medium text-white">
                          {user.name || 'User'}
                        </span>
                        <span className="small text-white-50" style={{ fontSize: '0.7rem' }}>
                          {user.email}
                        </span>
                      </div>
                    </div>
                  }
                  id="user-dropdown"
                  className="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item 
                    className="d-flex align-items-center py-2 dropdown-item-custom"
                  >
                    <BsPerson className="me-2 text-primary" size={18} />
                    My Profile
                  </NavDropdown.Item>
                  
                  <NavDropdown.Item 
                    className="d-flex align-items-center py-2 dropdown-item-custom"
                  >
                    <BsGear className="me-2 text-secondary" size={18} />
                    Settings
                  </NavDropdown.Item>
                  
                  <NavDropdown.Divider />
                  
                  <NavDropdown.Item 
                    onClick={handleLogout}
                    className="d-flex align-items-center py-2 text-danger dropdown-item-custom"
                    style={{ cursor: 'pointer' }}
                  >
                    <BsBoxArrowRight className="me-2" size={18} />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            )}
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* Custom CSS for additional styling */}
      <style jsx>{`
        .navbar-custom {
          transition: all 0.3s ease;
        }
        
        .brand-hover:hover {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }
        
        .nav-link-custom {
          transition: all 0.3s ease;
          border-radius: 8px;
          position: relative;
        }
        
        .nav-link-custom:hover {
          background-color: rgba(255,255,255,0.1);
          color: white !important;
        }
        
        .nav-link-custom::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -5px;
          left: 50%;
          background-color: white;
          transition: all 0.3s ease;
        }
        
        .nav-link-custom:hover::after {
          width: 100%;
          left: 0;
        }
        
        .notification-bell {
          transition: all 0.3s ease;
        }
        
        .notification-bell:hover {
          transform: scale(1.1);
        }
        
        .user-dropdown .dropdown-toggle {
          background-color: rgba(255,255,255,0.1) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          border-radius: 25px !important;
          padding: 8px 15px !important;
          transition: all 0.3s ease !important;
        }
        
        .user-dropdown .dropdown-toggle:hover {
          background-color: rgba(255,255,255,0.2) !important;
        }
        
        .user-dropdown .dropdown-toggle::after {
          display: none;
        }
        
        .user-dropdown .dropdown-menu {
          border: none !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
          border-radius: 10px !important;
          min-width: 200px !important;
          margin-top: 8px !important;
          animation: fadeIn 0.3s ease;
        }
        
        .dropdown-item-custom {
          transition: all 0.2s ease;
        }
        
        .dropdown-item-custom:hover {
          background-color: #f8f9fa;
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .navbar-toggler:focus {
          box-shadow: none !important;
        }
        
        @media (max-width: 991.98px) {
          .navbar-nav {
            background-color: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 10px;
            margin-top: 10px;
          }
          
          .user-dropdown .dropdown-toggle {
            background-color: transparent !important;
            border: none !important;
            padding: 8px 0 !important;
          }
        }
      `}</style>
    </>
  );
}

export default Navbar;