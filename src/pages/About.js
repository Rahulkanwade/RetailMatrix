import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function About() {
  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4">
        <h2 className="text-center text-primary">About Page</h2>
        <p className="text-muted text-center">
          Welcome to the About Page of our Business Management System. Here you can find information about the application and its purpose.
        </p>
      </div>
    </div>
  );
}

export default About;
