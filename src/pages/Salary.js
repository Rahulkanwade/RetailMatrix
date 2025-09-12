import { useState, useEffect, useCallback } from "react";

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [labourNames, setLabourNames] = useState([]);
  const [newSalary, setNewSalary] = useState({ labourName: "", salaryAmount: "" });
  const [newLabour, setNewLabour] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", variant: "" });

  // Show notification
  const showNotification = useCallback((message, variant) => {
    setNotification({ show: true, message, variant });
    setTimeout(() => {
      setNotification({ show: false, message: "", variant: "" });
    }, 5000);
  }, []);

  // Fetch Labourers
  const fetchLabourers = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/labourers", { 
        credentials: 'include'
      });
      const data = await response.json();
      setLabourNames(data.map((labour) => labour.name));
    } catch (error) {
      console.error("Error fetching labourers", error);
      showNotification("कामगारांची यादी लोड करता आली नाही. कृपया तुमचे इंटरनेट कनेक्शन तपासा.", "danger");
    }
  }, [showNotification]);

  // Fetch Salaries
  const fetchSalaries = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/salaries", { 
        credentials: 'include'
      });
      const data = await response.json();
       console.log("Fetched salaries data:", data); // Add this line
      setSalaries(data);

    } catch (error) {
      console.error("Error fetching salaries", error);
      showNotification("पगाराची माहिती लोड करता आली नाही. कृपया तुमचे इंटरनेट कनेक्शन तपासा.", "danger");
    }
  }, [showNotification]);

  useEffect(() => {
    fetchLabourers();
    fetchSalaries();
  }, [fetchLabourers, fetchSalaries]);

  // Add Salary
  // Add Salary
  const addSalary = async () => {
    if (!newSalary.labourName || !newSalary.salaryAmount) {
      showNotification("कृपया कामगाराचे नाव आणि पगाराची रक्कम दोन्ही भरा.", "warning");
      return;
    }

    const currentDate = new Date();
    const salaryEntry = {
      ...newSalary,
      day: currentDate.toLocaleDateString("mr-IN", { weekday: "long" }),
      date: currentDate.toISOString().split('T')[0],
      time: currentDate.toLocaleTimeString("mr-IN", { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const response = await fetch("http://localhost:5000/salaries", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(salaryEntry),
      });
      const data = await response.json();
      setSalaries([...salaries, data]);
      setNewSalary({ labourName: "", salaryAmount: "" });
      showNotification(`${newSalary.labourName} साठी ₹${newSalary.salaryAmount} पगार जोडला गेला आहे.`, "success");
    } catch (error) {
      console.error("Error adding salary", error);
      showNotification("पगार जोडण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.", "danger");
    }
  };

  // Add Labourer
  const addLabour = async () => {
    if (!newLabour.trim()) {
      showNotification("कृपया कामगाराचे योग्य नाव प्रविष्ट करा.", "warning");
      return;
    }

    try {
      await fetch("http://localhost:5000/labourers", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newLabour }),
      });
      setLabourNames([...labourNames, newLabour]);
      setNewLabour("");
      showNotification(`कामगार "${newLabour}" यशस्वीरित्या जोडला गेला.`, "success");
    } catch (error) {
      console.error("Error adding labourer", error);
      showNotification("कामगार जोडण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.", "danger");
    }
  };

  // Organize salaries by labour name
  const salariesByLabour = {};
  salaries.forEach((salary) => {
    if (!salariesByLabour[salary.labourName]) {
      salariesByLabour[salary.labourName] = [];
    }
    salariesByLabour[salary.labourName].push({
      amount: parseFloat(salary.salaryAmount),
      day: salary.day,
      date: salary.date,
      time: salary.time,
    });
  });

  // Calculate Total Salaries Given in the Current Month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalSalaryThisMonth = salaries
    .filter((salary) => {
      const salaryDate = new Date(salary.date);
      return (
        salaryDate.getMonth() === currentMonth &&
        salaryDate.getFullYear() === currentYear
      );
    })
    .reduce((total, salary) => total + parseFloat(salary.salaryAmount), 0);

  // Get month name
  const monthName = new Date().toLocaleString('mr-IN', { month: 'long' });

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container py-5">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-white mb-3">
            <i className="fas fa-money-check-alt me-3"></i>
            पगार व्यवस्थापन प्रणाली
          </h1>
          <p className="lead text-white-50">कामगारांचे पगार सहज आणि कार्यक्षमतेने व्यवस्थापित करा.</p>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`alert alert-${notification.variant} alert-dismissible fade show shadow-sm mb-4`} role="alert">
            <div className="d-flex align-items-center">
              <i className={`fas ${notification.variant === 'success' ? 'fa-check-circle' : notification.variant === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'} me-2`}></i>
              {notification.message}
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setNotification({ show: false })}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Action Cards */}
        <div className="row g-4 mb-5">
          {/* Add Worker Card */}
          <div className="col-lg-6">
            <div className="card h-100 shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-primary text-white border-0 py-3">
                <h4 className="mb-0 d-flex align-items-center">
                  <i className="fas fa-user-plus me-2"></i>
                  नवीन कामगार जोडा
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">
                    <i className="fas fa-user me-2"></i>कामगाराचे नाव
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg shadow-sm border-0"
                    style={{ backgroundColor: '#f8f9fa', fontSize: '16px' }}
                    value={newLabour}
                    onChange={(e) => {
                      const capitalizedName = e.target.value
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase());
                      setNewLabour(capitalizedName);
                    }}
                    placeholder="कामगाराचे नाव प्रविष्ट करा"
                  />
                </div>
                <button
                  onClick={addLabour}
                  className="btn btn-primary btn-lg w-100 shadow-sm"
                  style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)', border: 'none' }}
                >
                  <i className="fas fa-plus me-2"></i>कामगार जोडा
                </button>
              </div>
            </div>
          </div>

          {/* Add Salary Card */}
          <div className="col-lg-6">
            <div className="card h-100 shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <div className="card-header bg-success text-white border-0 py-3">
                <h4 className="mb-0 d-flex align-items-center">
                  <i className="fas fa-money-bill-wave me-2"></i>
                  पगाराची नोंदणी करा
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    <i className="fas fa-users me-2"></i>कामगार निवडा
                  </label>
                  <select
                    className="form-select form-select-lg shadow-sm border-0"
                    style={{ backgroundColor: '#f8f9fa', fontSize: '16px' }}
                    value={newSalary.labourName}
                    onChange={(e) => setNewSalary({ ...newSalary, labourName: e.target.value })}
                  >
                    <option value="">कामगार निवडा</option>
                    {labourNames.map((name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">
                    <i className="fas fa-rupee-sign me-2"></i>पगाराची रक्कम (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-lg shadow-sm border-0"
                    style={{ backgroundColor: '#f8f9fa', fontSize: '16px' }}
                    value={newSalary.salaryAmount}
                    onChange={(e) => setNewSalary({ ...newSalary, salaryAmount: e.target.value })}
                    placeholder="रक्कम प्रविष्ट करा"
                  />
                </div>
                <button
                  onClick={addSalary}
                  className="btn btn-success btn-lg w-100 shadow-sm"
                  style={{ background: 'linear-gradient(45deg, #28a745, #1e7e34)', border: 'none' }}
                >
                  <i className="fas fa-plus me-2"></i>पगार जोडा
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="card shadow-lg border-0 mb-5" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header bg-info text-white border-0 py-3">
            <h4 className="mb-0 d-flex align-items-center">
              <i className="fas fa-chart-bar me-2"></i>
              {monthName} महिन्याचा सारांश
            </h4>
          </div>
          <div className="card-body text-center py-5">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="p-3">
                  <i className="fas fa-calendar-alt fa-3x text-info mb-3"></i>
                  <h3 className="h5 text-muted">चालू महिना</h3>
                  <h2 className="h3 fw-bold text-dark">{monthName} 2025</h2>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3">
                  <i className="fas fa-money-bill-wave fa-3x text-success mb-3"></i>
                  <h3 className="h5 text-muted">एकूण दिलेला पगार</h3>
                  <h2 className="display-6 fw-bold text-success">₹{totalSalaryThisMonth.toLocaleString('en-IN')}</h2>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3">
                  <i className="fas fa-users fa-3x text-primary mb-3"></i>
                  <h3 className="h5 text-muted">एकूण कामगार</h3>
                  <h2 className="display-6 fw-bold text-primary">{labourNames.length}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Records */}
        <div className="card shadow-lg border-0 mb-5" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="card-header bg-dark text-white border-0 py-3">
            <h4 className="mb-0 d-flex align-items-center">
              <i className="fas fa-table me-2"></i>
              पगाराची नोंदी
            </h4>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="py-3 px-4 fw-semibold text-dark border-0">
                      <i className="fas fa-user me-2"></i>कामगाराचे नाव
                    </th>
                    <th className="py-3 px-4 fw-semibold text-dark border-0">
                      <i className="fas fa-money-bill me-2"></i>पगाराची रक्कम
                    </th>
                    <th className="py-3 px-4 fw-semibold text-dark border-0 d-none d-md-table-cell">
                      <i className="fas fa-calendar-day me-2"></i>दिवस
                    </th>
                    <th className="py-3 px-4 fw-semibold text-dark border-0">
                      <i className="fas fa-calendar me-2"></i>तारीख
                    </th>
                    <th className="py-3 px-4 fw-semibold text-dark border-0 d-none d-lg-table-cell">
                      <i className="fas fa-clock me-2"></i>वेळ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(salariesByLabour).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                        <span className="fs-5">कोणतीही पगाराची नोंद उपलब्ध नाही.</span>
                      </td>
                    </tr>
                  ) : (
                    Object.keys(salariesByLabour).map((labourName, index) =>
                      salariesByLabour[labourName].map((salary, i) => (
                        <tr key={`${index}-${i}`} className="border-0">
                          {i === 0 && (
                            <td
                              rowSpan={salariesByLabour[labourName].length}
                              className="align-middle py-3 px-4 fw-bold border-0"
                              style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)' }}
                            >
                              <div className="d-flex align-items-center">
                                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                                  <i className="fas fa-user text-white"></i>
                                </div>
                                <span className="text-dark">{labourName}</span>
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-4 fw-bold text-success border-0">
                            <span className="badge bg-success bg-opacity-10 text-success fs-6 px-3 py-2">
                              ₹{salary.amount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted border-0 d-none d-md-table-cell">{salary.day}</td>
                          <td className="py-3 px-4 text-dark border-0">
                            <span className="badge bg-light text-dark">{salary.date}</span>
                          </td>
                          <td className="py-3 px-4 text-muted border-0 d-none d-lg-table-cell">{salary.time}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
                {Object.keys(salariesByLabour).length > 0 && (
                  <tfoot style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <td colSpan="4" className="text-end fw-bold py-3 px-4 border-0">
                        <span className="fs-5">या महिन्याचा एकूण पगार:</span>
                      </td>
                      <td className="fw-bold py-3 px-4 border-0">
                        <span className="badge bg-success fs-5 px-3 py-2">
                          ₹{totalSalaryThisMonth.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Print Instructions */}
        <div className="card shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="mb-2 d-flex align-items-center text-dark">
                  <i className="fas fa-print me-2 text-secondary"></i>
                  मुद्रित अहवाल हवा आहे का?
                </h5>
                <p className="mb-0 text-muted">
                  हा पृष्ठ मुद्रित करण्यासाठी, आपल्या कीबोर्डवर <span className="badge bg-dark mx-1">Ctrl</span> + <span className="badge bg-dark mx-1">P</span> 
                  (किंवा मॅकवर <span className="badge bg-dark mx-1">Cmd</span> + <span className="badge bg-dark mx-1">P</span>) दाबा.
                </p>
              </div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                  <i className="fas fa-print me-2"></i>अहवाल मुद्रित करा
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Font Awesome CDN */}
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
        rel="stylesheet" 
      />
    </div>
  );
}