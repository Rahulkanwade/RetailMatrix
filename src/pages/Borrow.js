import React, { useState, useEffect, useCallback } from "react";
const API_BASE_URL = "http://localhost:5000";

function App() {
  const [borrower, setBorrower] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showHistory, setShowHistory] = useState({});
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalLoaned: 0,
    totalRepaid: 0,
    totalPending: 0,
    totalLoans: 0
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Add this API helper function
  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Show notification to user
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(""), 3000);
  }, []);

  // Wrap fetchLoans with useCallback
  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/loans');
      setLoans(data);

      const repaymentData = {};
      for (const loan of data) {
        const repaymentHistory = await apiCall(`/loans/${loan.id}/repayments`);
        if (repaymentHistory.length > 0) {
          repaymentData[loan.id] = repaymentHistory;
        }
      }
      setRepayments(repaymentData);
    } catch (error) {
      showNotification(error.message || 'Failed to fetch loans', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Wrap fetchStats with useCallback
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiCall('/loans/stats');
      setStats({
        totalLoaned: Number(data.totalLoaned || 0),
        totalRepaid: Number(data.totalRepaid || 0),
        totalPending: Number(data.totalPending || 0),
        totalLoans: Number(data.totalLoans || 0)
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        totalLoaned: 0,
        totalRepaid: 0,
        totalPending: 0,
        totalLoans: 0
      });
    }
  }, []);

  // Now the useEffect can include the dependencies
  useEffect(() => {
    fetchLoans();
    fetchStats();
  }, [fetchLoans, fetchStats]);

  // Get unique borrower names from existing loans
  const getUniqueBorrowerNames = () => {
    const names = loans.map(loan => loan.borrower.trim());
    return [...new Set(names)]; // Remove duplicates
  };

  // Filter suggestions based on input
  const filterSuggestions = (input) => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const uniqueNames = getUniqueBorrowerNames();
    const filtered = uniqueNames.filter(name =>
      name.toLowerCase().includes(input.toLowerCase()) &&
      name.toLowerCase() !== input.toLowerCase()
    );

    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    setShowSuggestions(filtered.length > 0);
  };

  // Handle suggestion selection
  const selectSuggestion = (name) => {
    setBorrower(name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle borrower input changes
  const handleBorrowerChange = (e) => {
    const value = e.target.value;
    setBorrower(value);
    filterSuggestions(value);
  };

  // Handle input blur (hide suggestions after delay)
  const handleBorrowerBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const addLoan = async () => {
    if (!borrower.trim()) {
      showNotification("Please enter the borrower's name", "error");
      return;
    }
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      showNotification("Please enter a valid loan amount", "error");
      return;
    }

    try {
      setLoading(true);
      await apiCall('/loans', {
        method: 'POST',
        body: JSON.stringify({
          borrower: borrower.trim(),
          loanAmount: parseFloat(loanAmount)
        })
      });

      setBorrower("");
      setLoanAmount("");
      // ADD these two lines:
      setShowSuggestions(false);
      setSuggestions([]);

      showNotification(`Loan of ₹${parseFloat(loanAmount).toFixed(2)} added for ${borrower.trim()}`);

      await fetchLoans();
      await fetchStats();
    } catch (error) {
      showNotification(error.message || 'Failed to add loan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteLoan = async (loan) => {
    if (window.confirm(`Are you sure you want to delete the loan for ${loan.borrower}?`)) {
      try {
        setLoading(true);
        await apiCall(`/loans/${loan.id}`, {
          method: 'DELETE'
        });

        showNotification(`Loan for ${loan.borrower} has been deleted`);
        await fetchLoans();
        await fetchStats();
      } catch (error) {
        showNotification(error.message || 'Failed to delete loan', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // REPLACE your existing addRepayment function with this:
  const addRepayment = async (loan, amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      showNotification("Please enter a valid repayment amount", "error");
      return;
    }

    const amt = parseFloat(amount);
    const currentRepaid = getTotalRepaid(loan.id);
    const remaining = loan.loanAmount - currentRepaid;

    if (amt > remaining) {
      if (!window.confirm(`The amount ₹${amt.toFixed(2)} is more than the remaining balance of ₹${remaining.toFixed(2)}. Do you want to continue?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      await apiCall(`/loans/${loan.id}/repayments`, {
        method: 'POST',
        body: JSON.stringify({ amount: amt })
      });

      const newRemaining = remaining - amt;
      if (newRemaining <= 0) {
        showNotification(`Great! ${loan.borrower} has fully repaid their loan!`, "success");
      } else {
        showNotification(`Repayment of ₹${amt.toFixed(2)} recorded for ${loan.borrower}. Remaining: ₹${newRemaining.toFixed(2)}`);
      }

      await fetchLoans();
      await fetchStats();
    } catch (error) {
      showNotification(error.message || 'Failed to add repayment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // REPLACE your existing deleteRepayment function with this:
  const deleteRepayment = async (loan, repaymentId, repaymentAmount) => {
    // Convert to number first to handle string values from API
    const amount = Number(repaymentAmount || 0);

    if (window.confirm(`Are you sure you want to remove this ₹${amount.toFixed(2)} repayment?`)) {
      try {
        setLoading(true);
        await apiCall(`/repayments/${repaymentId}`, {
          method: 'DELETE'
        });

        showNotification(`Repayment of ₹${amount.toFixed(2)} has been removed`);
        await fetchLoans();
        await fetchStats();
      } catch (error) {
        showNotification(error.message || 'Failed to delete repayment', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const clearAllData = async () => {
    if (window.confirm("This will delete all your loan records. Are you absolutely sure?")) {
      if (window.confirm("This action cannot be undone. Click OK to proceed.")) {
        try {
          setLoading(true);
          for (const loan of loans) {
            await apiCall(`/loans/${loan.id}`, { method: 'DELETE' });
          }

          showNotification("All data has been cleared");
          await fetchLoans();
          await fetchStats();
        } catch (error) {
          showNotification(error.message || 'Failed to clear all data', 'error');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // UPDATE your existing getTotalRepaid function:
  const getTotalRepaid = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    return loan ? parseFloat(loan.totalRepaid || 0) : 0;
  };
  // ADD this new helper function:
  const getPendingAmount = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    return loan ? parseFloat(loan.pendingAmount || loan.loanAmount) : 0;
  };

  // UPDATE your toggleHistory function:
  const toggleHistory = async (loanId) => {
    setShowHistory(prev => ({
      ...prev,
      [loanId]: !prev[loanId]
    }));

    if (!repayments[loanId] && !showHistory[loanId]) {
      try {
        const repaymentHistory = await apiCall(`/loans/${loanId}/repayments`);
        setRepayments(prev => ({
          ...prev,
          [loanId]: repaymentHistory
        }));
      } catch (error) {
        console.error('Failed to fetch repayment history:', error);
      }
    }
  };

  const markAsFullyPaid = (loan) => {
    const currentRepaid = getTotalRepaid(loan.id);
    const remaining = loan.loanAmount - currentRepaid;

    if (remaining <= 0) {
      showNotification("This loan is already fully paid!", "error");
      return;
    }

    if (window.confirm(`Mark the remaining ₹${remaining.toFixed(2)} as paid for ${loan.borrower}?`)) {
      addRepayment(loan, remaining.toString());
    }
  };

  // Simple filtering - only show what matters
  const filteredLoans = loans
    .filter(loan => {
      const matchesSearch = loan.borrower.toLowerCase().includes(searchTerm.toLowerCase());
      const pending = getPendingAmount(loan.id);

      if (filterStatus === "pending") return pending > 0 && matchesSearch;
      if (filterStatus === "paid") return pending <= 0 && matchesSearch;
      return matchesSearch;
    })
    .sort((a, b) => {
      const aPending = getPendingAmount(a.id);
      const bPending = getPendingAmount(b.id);
      return bPending - aPending;
    });


  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {loading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {/* Notification */}
        {notification && (
          <div className={`alert alert-${notification.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} role="alert">
            <i className={`fas fa-${notification.type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2`}></i>
            {notification.message}
            <button type="button" className="btn-close" onClick={() => setNotification("")}></button>
          </div>
        )}

        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="bg-primary text-white p-4 rounded-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="mb-0">💰 Money Lent Tracker</h1>
                  <p className="mb-0 mt-2 opacity-75">Keep track of money you've lent to others</p>
                </div>
                {loans.length > 0 && (
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={clearAllData}
                    title="Delete all records"
                    disabled={loading}
                  >
                    <i className="fas fa-trash me-1"></i>Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loans.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-primary mb-2">
                    <i className="fas fa-hand-holding-usd" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h5 className="card-title text-muted">Total Money Lent</h5>
                  <h3 className="text-primary mb-0">₹{Number(stats.totalLoaned || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-success mb-2">
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h5 className="card-title text-muted">Money Returned</h5>
                  <h3 className="text-success mb-0">₹{Number(stats.totalRepaid || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-danger mb-2">
                    <i className="fas fa-clock" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h5 className="card-title text-muted">Still Pending</h5>
                  <h3 className="text-danger mb-0">₹{Number(stats.totalPending || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Add Loan Form */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle text-primary me-2"></i>
                  Record New Loan
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label">Who did you lend money to?</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter person's name"
                        value={borrower}
                        onChange={handleBorrowerChange}
                        onBlur={handleBorrowerBlur}
                        onFocus={() => filterSuggestions(borrower)}
                        disabled={loading}
                      />

                      {/* Suggestions dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1"
                          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-2 border-bottom suggestion-item"
                              style={{ cursor: 'pointer' }}
                              onMouseDown={() => selectSuggestion(suggestion)}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div className="d-flex align-items-center">
                                <i className="fas fa-user text-muted me-2"></i>
                                <span>{suggestion}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">How much money? (₹)</label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="Enter amount"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addLoan();
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      className="btn btn-primary btn-lg w-100"
                      onClick={addLoan}
                      disabled={!borrower.trim() || !loanAmount || parseFloat(loanAmount) <= 0}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        {loans.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Search by name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type a name to search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Show</label>
                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Records</option>
                        <option value="pending">Money Still Pending</option>
                        <option value="paid">Fully Returned</option>
                        disabled={loading}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loans Records - Mobile Friendly */}
        {filteredLoans.length > 0 ? (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0">
                    <i className="fas fa-list text-primary me-2"></i>
                    Your Loan Records ({filteredLoans.length} {filteredLoans.length === 1 ? 'record' : 'records'})
                  </h5>
                </div>
                <div className="card-body p-2 p-md-3">
                  {/* Desktop Table View */}
                  <div className="d-none d-lg-block">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="border-0 py-3">Person</th>
                            <th className="border-0 py-3">Amount Lent</th>
                            <th className="border-0 py-3">Returned So Far</th>
                            <th className="border-0 py-3">Still Pending</th>
                            <th className="border-0 py-3">Record Return</th>
                            <th className="border-0 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLoans.map((loan) => {
                            const totalRepaid = getTotalRepaid(loan.id);
                            const pending = getPendingAmount(loan.id);
                            const isFullyPaid = pending <= 0;

                            return (
                              <React.Fragment key={loan.id}>
                                <tr className={isFullyPaid ? 'table-success' : pending > 1000 ? 'table-warning' : ''}>
                                  <td className="py-4">
                                    <div className="d-flex align-items-center">
                                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${isFullyPaid ? 'bg-success' : 'bg-warning'}`}
                                        style={{ width: '40px', height: '40px', fontSize: '16px', color: 'white' }}>
                                        {isFullyPaid ? '✓' : '⏳'}
                                      </div>
                                      <div>
                                        <div className="fw-bold fs-6 mb-1">{loan.borrower}</div>
                                        <div className="text-muted small">
                                          Lent on {new Date(loan.dateAdded).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    <div className="fw-bold text-primary fs-5">
                                      ₹{Number(loan.loanAmount || 0).toFixed(2)}
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    <div className="fw-bold text-success fs-5 mb-1">
                                      ₹{Number(totalRepaid || 0).toFixed(2)}
                                    </div>
                                    {repayments[loan.id] && repayments[loan.id].length > 0 && (
                                      <button
                                        className="btn btn-sm btn-outline-info rounded-pill px-3"
                                        onClick={() => !loading && toggleHistory(loan.id)}
                                        disabled={loading}
                                        title="View payment history"
                                      >
                                        <i className="fas fa-history me-1"></i>
                                        History
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-4">
                                    <div className={`fw-bold fs-5 ${pending > 0 ? 'text-danger' : 'text-secondary'}`}>
                                      ₹{Number(pending || 0).toFixed(2)}
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    {!isFullyPaid ? (
                                      <div className="d-flex gap-2 align-items-center">
                                        <div className="input-group" style={{ maxWidth: '150px' }}>
                                          <span className="input-group-text">₹</span>
                                          <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Amount"
                                            disabled={loading}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" && !loading) {
                                                addRepayment(loan, e.target.value);
                                                e.target.value = "";
                                              }
                                            }}
                                          />
                                        </div>
                                        <button
                                          className="btn btn-success rounded-pill px-3"
                                          type="button"
                                          disabled={loading}
                                          onClick={(e) => {
                                            if (!loading) {
                                              const input = e.target.parentElement.querySelector('input');
                                              addRepayment(loan, input.value);
                                              input.value = "";
                                            }
                                          }}
                                          title="Record this payment"
                                        >
                                          <i className="fas fa-plus me-1"></i>
                                          Add
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="text-success fw-bold">
                                        <i className="fas fa-check-circle me-1"></i>
                                        Fully Paid
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4">
                                    <div className="d-flex gap-2">
                                      {!isFullyPaid && (
                                        <button
                                          className="btn btn-success rounded-pill px-3"
                                          onClick={() => !loading && markAsFullyPaid(loan)}
                                          disabled={loading}
                                          title="Mark as fully paid"
                                        >
                                          <i className="fas fa-check me-1"></i>
                                          Mark Paid
                                        </button>
                                      )}
                                      <button
                                        className="btn btn-outline-danger rounded-pill px-3"
                                        onClick={() => !loading && deleteLoan(loan)}
                                        disabled={loading}
                                        title="Delete this record"
                                      >
                                        <i className="fas fa-trash me-1"></i>
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {/* Desktop Repayment History */}
                                {showHistory[loan.id] && repayments[loan.id] && (
                                  <tr>
                                    <td colSpan="6" className="bg-light">
                                      <div className="p-3">
                                        <h6 className="mb-3">
                                          <i className="fas fa-history me-2"></i>
                                          Payment History for {loan.borrower}
                                        </h6>
                                        <div className="table-responsive">
                                          <table className="table table-sm mb-0">
                                            <thead>
                                              <tr>
                                                <th>Date Returned</th>
                                                <th>Amount</th>
                                                <th>Remove</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {repayments[loan.id].map((repayment) => (
                                                <tr key={repayment.id}>
                                                  <td>{new Date(repayment.date).toLocaleDateString()}</td>
                                                  <td>₹{Number(repayment.amount || 0).toFixed(2)}</td>
                                                  <td>
                                                    <button
                                                      className="btn btn-sm btn-outline-danger"
                                                      onClick={() => !loading && deleteRepayment(loan, repayment.id, repayment.amount)}
                                                      disabled={loading}
                                                      title="Remove this payment record"
                                                    >
                                                      <i className="fas fa-trash"></i>
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="d-lg-none">
                    {filteredLoans.map((loan) => {
                      const totalRepaid = getTotalRepaid(loan.id);
                      const pending = getPendingAmount(loan.id);
                      const isFullyPaid = pending <= 0;

                      return (
                        <React.Fragment key={loan.id}>
                          <div className={`card mb-3 border-0 shadow-sm ${isFullyPaid ? 'bg-light-success' : pending > 1000 ? 'bg-light-warning' : ''}`}
                            style={{
                              backgroundColor: isFullyPaid ? '#d1edff' : pending > 1000 ? '#fff3cd' : 'white',
                              border: isFullyPaid ? '1px solid #0dcaf0' : pending > 1000 ? '1px solid #ffc107' : '1px solid #dee2e6'
                            }}>
                            <div className="card-body p-3">
                              {/* Header with person info */}
                              <div className="d-flex align-items-center mb-3">
                                <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${isFullyPaid ? 'bg-success' : 'bg-warning'}`}
                                  style={{ width: '45px', height: '45px', fontSize: '18px', color: 'white' }}>
                                  {isFullyPaid ? '✓' : '⏳'}
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 fw-bold">{loan.borrower}</h6>
                                  <small className="text-muted">
                                    Lent on {new Date(loan.dateAdded).toLocaleDateString()}
                                  </small>
                                </div>
                                {isFullyPaid && (
                                  <div className="badge bg-success fs-6 px-3 py-2">
                                    <i className="fas fa-check-circle me-1"></i>
                                    Paid
                                  </div>
                                )}
                              </div>

                              {/* Amount details grid */}
                              <div className="row g-2 mb-3">
                                <div className="col-4">
                                  <div className="text-center p-2 bg-light rounded">
                                    <div className="small text-muted mb-1">Lent</div>
                                    <div className="fw-bold text-primary">
                                      ₹{Number(loan.loanAmount || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-4">
                                  <div className="text-center p-2 bg-light rounded">
                                    <div className="small text-muted mb-1">Returned</div>
                                    <div className="fw-bold text-success">
                                      ₹{Number(totalRepaid || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="col-4">
                                  <div className="text-center p-2 bg-light rounded">
                                    <div className="small text-muted mb-1">Pending</div>
                                    <div className={`fw-bold ${pending > 0 ? 'text-danger' : 'text-secondary'}`}>
                                      ₹{Number(pending || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Record payment section */}
                              {!isFullyPaid && (
                                <div className="mb-3">
                                  <label className="form-label small text-muted mb-2">Record Payment</label>
                                  <div className="d-flex gap-2">
                                    <div className="input-group flex-grow-1">
                                      <span className="input-group-text">₹</span>
                                      <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Amount"
                                        disabled={loading}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !loading) {
                                            addRepayment(loan, e.target.value);
                                            e.target.value = "";
                                          }
                                        }}
                                      />
                                    </div>
                                    <button
                                      className="btn btn-primary"
                                      type="button"
                                      disabled={loading}
                                      onClick={(e) => {
                                        if (!loading) {
                                          const input = e.target.parentElement.querySelector('input');
                                          addRepayment(loan, input.value);
                                          input.value = "";
                                        }
                                      }}
                                      title="Record this payment"
                                      style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '20px',
                                        padding: '8px 16px',
                                        fontWeight: '500',
                                        boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseOver={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px 0 rgba(102, 126, 234, 0.6)';
                                      }}
                                      onMouseOut={(e) => {
                                        e.target.style.transform = 'translateY(0px)';
                                        e.target.style.boxShadow = '0 4px 15px 0 rgba(102, 126, 234, 0.4)';
                                      }}
                                    >
                                      <i className="fas fa-paper-plane me-1"></i>
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="d-flex gap-2 flex-wrap">
                                {repayments[loan.id] && repayments[loan.id].length > 0 && (
                                  <button
                                    className="btn btn-outline-info btn-sm flex-fill"
                                    onClick={() => !loading && toggleHistory(loan.id)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-history me-1"></i>
                                    {showHistory[loan.id] ? 'Hide' : 'Show'} History
                                  </button>
                                )}
                                {!isFullyPaid && (
                                  <button
                                    className="btn btn-success btn-sm flex-fill"
                                    onClick={() => !loading && markAsFullyPaid(loan)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-check me-1"></i>
                                    Mark Paid
                                  </button>
                                )}
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => !loading && deleteLoan(loan)}
                                  disabled={loading}
                                  style={{ minWidth: '80px' }}
                                >
                                  <i className="fas fa-trash me-1"></i>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Payment History */}
                          {showHistory[loan.id] && repayments[loan.id] && (
                            <div className="card mb-3 border-0 bg-light">
                              <div className="card-body p-3">
                                <h6 className="mb-3">
                                  <i className="fas fa-history me-2"></i>
                                  Payment History for {loan.borrower}
                                </h6>
                                <div className="row g-2">
                                  {repayments[loan.id].map((repayment, index) => (
                                    <div key={repayment.id} className="col-12">
                                      <div className="card border-0 bg-white">
                                        <div className="card-body p-2">
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              <div className="fw-bold text-success">
                                                ₹{Number(repayment.amount || 0).toFixed(2)}
                                              </div>
                                              <small className="text-muted">
                                                {new Date(repayment.date).toLocaleDateString()}
                                              </small>
                                            </div>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() => !loading && deleteRepayment(loan, repayment.id, repayment.amount)}
                                              disabled={loading}
                                              title="Remove this payment"
                                            >
                                              <i className="fas fa-trash"></i>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : loans.length > 0 ? (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="text-muted mb-3">
                    <i className="fas fa-search" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h5 className="text-muted">No records found</h5>
                  <p className="text-muted">Try changing your search or filter settings</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="text-muted mb-3">
                    <i className="fas fa-hand-holding-usd" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h5 className="text-muted">No loan records yet</h5>
                  <p className="text-muted">Start by recording the first loan you've given to someone</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;