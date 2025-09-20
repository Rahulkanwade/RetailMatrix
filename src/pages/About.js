import React from 'react';
import { Award, Users, Clock, Shield, Target, Heart, MapPin, Phone, Mail } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

function About() {
  const styles = {
    heroSection: {
      background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
      position: 'relative',
      overflow: 'hidden'
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.1)'
    },
    heroContent: {
      position: 'relative',
      zIndex: 2
    },
    pageBackground: {
      background: 'linear-gradient(135deg, #fef7ed 0%, #fffbeb 50%, #fefce8 100%)',
      minHeight: '100vh'
    },
    featureCard: {
      transition: 'all 0.3s ease',
      border: 'none',
      borderRadius: '1rem',
      overflow: 'hidden'
    },
    featureCardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    gradientText: {
      background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    iconWrapper: {
      width: '4rem',
      height: '4rem',
      borderRadius: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.2)'
    }
  };

  const features = [
    {
      icon: <Target size={32} />,
      title: "Order Management",
      description: "Efficient tracking of custom orders, delivery schedules, and customer preferences",
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
    },
    {
      icon: <Users size={32} />,
      title: "Customer Relations", 
      description: "Comprehensive customer database with order history and loyalty tracking",
      gradient: "linear-gradient(135deg, #10b981, #059669)"
    },
    {
      icon: <Clock size={32} />,
      title: "Inventory Control",
      description: "Real-time tracking of ingredients, supplies, and finished products",
      gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)"
    },
    {
      icon: <Award size={32} />,
      title: "Quality Assurance", 
      description: "Maintaining consistent quality standards across all products and services",
      gradient: "linear-gradient(135deg, #f59e0b, #ea580c)"
    },
    {
      icon: <Shield size={32} />,
      title: "Financial Management",
      description: "Complete financial overview with sales analytics and profit tracking", 
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)"
    },
    {
      icon: <Heart size={32} />,
      title: "Staff Management",
      description: "Employee scheduling, performance tracking, and task management",
      gradient: "linear-gradient(135deg, #ec4899, #db2777)"
    }
  ];

  return (
    <div style={styles.pageBackground}>
      {/* Hero Section */}
      <section style={styles.heroSection} className="text-white">
        <div style={styles.heroOverlay}></div>
        <div className="container py-5" style={styles.heroContent}>
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center py-5">
              <h1 className="display-3 fw-bold mb-4">
                Welcome to <span style={{color: '#fef3c7'}}>Laxmi Bakery</span>
              </h1>
              <p className="lead mb-4" style={{color: '#fed7aa'}}>
                Crafting delicious moments since our beginning, powered by cutting-edge technology
              </p>
              <div className="d-inline-flex align-items-center px-4 py-2 rounded-pill" 
                   style={{background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)'}}>
                <Heart size={20} className="me-2" style={{color: '#fca5a5'}} />
                <span className="small fw-medium">Made with love, managed with precision</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-5">
        {/* Business Overview */}
        <section className="mb-5">
          <div className="card shadow-lg border-0" style={{borderRadius: '1.5rem', border: '1px solid #fed7aa'}}>
            <div className="card-body p-5">
              <div className="text-center mb-5">
                <h2 className="display-5 fw-bold text-dark mb-4">About Laxmi Bakery</h2>
                <div className="mx-auto" style={{width: '6rem', height: '4px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', borderRadius: '2px'}}></div>
              </div>
              
              <div className="row align-items-center g-4">
                <div className="col-md-6">
                  <p className="text-muted fs-5 lh-lg mb-4">
                    Laxmi Bakery has been serving the community with fresh, delicious baked goods and exceptional service. 
                    Our commitment to quality ingredients and traditional recipes, combined with modern business practices, 
                    makes us a trusted name in the bakery industry.
                  </p>
                  <p className="text-muted fs-5 lh-lg">
                    From artisanal breads to custom celebration cakes, we take pride in creating memorable experiences 
                    for our customers while maintaining the highest standards of hygiene and quality.
                  </p>
                </div>
                <div className="col-md-6">
                  <div className="p-4 rounded-3" style={{background: 'linear-gradient(135deg, #fed7aa, #fef3c7)'}}>
                    <h3 className="h4 fw-semibold text-dark mb-4">Our Specialties</h3>
                    <ul className="list-unstyled text-dark">
                      {['Fresh Daily Breads', 'Custom Wedding Cakes', 'Traditional Sweets', 'Birthday Celebrations', 'Corporate Catering'].map((item, index) => (
                        <li key={index} className="d-flex align-items-center mb-2">
                          <span className="rounded-circle me-3" style={{width: '8px', height: '8px', background: '#ea580c'}}></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Management System Features */}
        <section className="mb-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-4">Our Business Management System</h2>
            <p className="text-muted fs-5 col-lg-8 mx-auto">
              Streamlining operations with our comprehensive digital solution designed specifically for bakery businesses
            </p>
          </div>

          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-lg border-0" 
                     style={styles.featureCard}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = 'translateY(-5px)';
                       e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                     }}>
                  <div className="text-white p-4 text-center" style={{background: feature.gradient}}>
                    <div className="mx-auto mb-3" style={styles.iconWrapper}>
                      {feature.icon}
                    </div>
                    <h3 className="h4 fw-semibold">{feature.title}</h3>
                  </div>
                  <div className="card-body p-4 text-center">
                    <p className="text-muted lh-lg mb-0">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-5">
          <div className="card shadow-lg border-0" style={{borderRadius: '1.5rem', overflow: 'hidden'}}>
            <div className="text-white p-5 text-center" style={{background: 'linear-gradient(135deg, #ea580c, #f59e0b)'}}>
              <h2 className="display-6 fw-bold mb-2">Get in Touch</h2>
              <p className="mb-0" style={{color: '#fed7aa'}}>We'd love to hear from you and serve your bakery needs</p>
            </div>
            
            <div className="card-body p-5">
              <div className="row g-4 text-center">
                <div className="col-md-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" 
                       style={{width: '4rem', height: '4rem', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'}}>
                    <MapPin size={32} style={{color: '#2563eb'}} />
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-3">Visit Us</h3>
                  <p className="text-muted mb-0">
                    123 Baker Street<br />
                    Latur, Maharashtra<br />
                    India - 413512
                  </p>
                </div>
                
                <div className="col-md-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" 
                       style={{width: '4rem', height: '4rem', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)'}}>
                    <Phone size={32} style={{color: '#059669'}} />
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-3">Call Us</h3>
                  <p className="text-muted mb-0">
                    +91 98765 43210<br />
                    +91 87654 32109<br />
                    Open: 6:00 AM - 10:00 PM
                  </p>
                </div>
                
                <div className="col-md-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" 
                       style={{width: '4rem', height: '4rem', background: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)'}}>
                    <Mail size={32} style={{color: '#7c3aed'}} />
                  </div>
                  <h3 className="h5 fw-semibold text-dark mb-3">Email Us</h3>
                  <p className="text-muted mb-0">
                    info@laxmibakery.com<br />
                    orders@laxmibakery.com<br />
                    support@laxmibakery.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card text-white shadow-lg border-0 h-100" 
                   style={{background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '1.5rem'}}>
                <div className="card-body p-5">
                  <div className="d-flex align-items-center mb-4">
                    <div className="me-3 rounded-3" style={styles.iconWrapper}>
                      <Target size={24} />
                    </div>
                    <h3 className="h3 fw-bold mb-0">Our Mission</h3>
                  </div>
                  <p className="lh-lg mb-0" style={{color: '#fed7aa'}}>
                    To create exceptional baked goods that bring joy to our community while maintaining the highest 
                    standards of quality, hygiene, and customer service. We strive to blend traditional recipes with 
                    modern technology to deliver unforgettable experiences.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card text-white shadow-lg border-0 h-100" 
                   style={{background: 'linear-gradient(135deg, #f59e0b, #eab308)', borderRadius: '1.5rem'}}>
                <div className="card-body p-5">
                  <div className="d-flex align-items-center mb-4">
                    <div className="me-3 rounded-3" style={styles.iconWrapper}>
                      <Award size={24} />
                    </div>
                    <h3 className="h3 fw-bold mb-0">Our Vision</h3>
                  </div>
                  <p className="lh-lg mb-0" style={{color: '#fef3c7'}}>
                    To become the most trusted and beloved bakery in the region, known for our quality products, 
                    innovative management systems, and commitment to customer satisfaction. We envision a future 
                    where technology enhances tradition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;