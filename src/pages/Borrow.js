import React, { useState } from "react";

function App() {
  const [borrower, setBorrower] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showHistory, setShowHistory] = useState({});
  const [notification, setNotification] = useState("");

  // Show notification to user
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(""), 3000);
  };

  const addLoan = () => {
    // Better validation with user feedback
    if (!borrower.trim()) {
      showNotification("Please enter the borrower's name", "error");
      return;
    }
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      showNotification("Please enter a valid loan amount", "error");
      return;
    }

    const newLoan = {
      id: Date.now(),
      borrower: borrower.trim(),
      loanAmount: parseFloat(loanAmount),
      dateAdded: new Date().toISOString()
    };

    setLoans([...loans, newLoan]);
    setBorrower("");
    setLoanAmount("");
    showNotification(`Loan of ₹${parseFloat(loanAmount).toFixed(2)} added for ${borrower.trim()}`);
  };

  const deleteLoan = (loan) => {
    if (window.confirm(`Are you sure you want to delete the loan for ${loan.borrower}?`)) {
      setLoans(loans.filter(l => l.id !== loan.id));
      // Remove repayments for this loan
      const updatedRepayments = { ...repayments };
      delete updatedRepayments[loan.id];
      setRepayments(updatedRepayments);
      showNotification(`Loan for ${loan.borrower} has been deleted`);
    }
  };

  const addRepayment = (loan, amount) => {
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

    const updated = { ...repayments };
    if (!updated[loan.id]) updated[loan.id] = [];
    updated[loan.id].push({
      amount: amt,
      date: new Date().toISOString(),
      id: Date.now()
    });
    setRepayments(updated);

    const newRemaining = remaining - amt;
    if (newRemaining <= 0) {
      showNotification(`Great! ${loan.borrower} has fully repaid their loan!`, "success");
    } else {
      showNotification(`Repayment of ₹${amt.toFixed(2)} recorded for ${loan.borrower}. Remaining: ₹${newRemaining.toFixed(2)}`);
    }
  };

  const deleteRepayment = (loan, repaymentId, repaymentAmount) => {
    if (window.confirm(`Are you sure you want to remove this ₹${repaymentAmount.toFixed(2)} repayment?`)) {
      const updated = { ...repayments };
      updated[loan.id] = updated[loan.id].filter(r => r.id !== repaymentId);
      if (updated[loan.id].length === 0) {
        delete updated[loan.id];
      }
      setRepayments(updated);
      showNotification(`Repayment of ₹${repaymentAmount.toFixed(2)} has been removed`);
    }
  };

  const getTotalRepaid = (loanId) =>
    (repayments[loanId] || []).reduce((sum, repayment) => sum + repayment.amount, 0);

  const getTotalLoaned = () =>
    loans.reduce((sum, loan) => sum + loan.loanAmount, 0);

  const getTotalRepaidAll = () =>
    Object.values(repayments).reduce((sum, repayArray) =>
      sum + repayArray.reduce((innerSum, repayment) => innerSum + repayment.amount, 0), 0);

  const getTotalPending = () => getTotalLoaned() - getTotalRepaidAll();

  const toggleHistory = (loanId) => {
    setShowHistory(prev => ({
      ...prev,
      [loanId]: !prev[loanId]
    }));
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
      const totalRepaid = getTotalRepaid(loan.id);
      const pending = loan.loanAmount - totalRepaid;

      if (filterStatus === "pending") return pending > 0 && matchesSearch;
      if (filterStatus === "paid") return pending <= 0 && matchesSearch;
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by pending amount (highest first) to show urgent ones first
      const aPending = a.loanAmount - getTotalRepaid(a.id);
      const bPending = b.loanAmount - getTotalRepaid(b.id);
      return bPending - aPending;
    });

  const clearAllData = () => {
    if (window.confirm("This will delete all your loan records. Are you absolutely sure?")) {
      if (window.confirm("This action cannot be undone. Click OK to proceed.")) {
        setLoans([]);
        setRepayments({});
        showNotification("All data has been cleared");
      }
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
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
                  >
                    <i className="fas fa-trash me-1"></i>Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {loans.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="text-primary mb-2">
                    <i className="fas fa-hand-holding-usd" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h5 className="card-title text-muted">Total Money Lent</h5>
                  <h3 className="text-primary mb-0">₹{getTotalLoaned().toFixed(2)}</h3>
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
                  <h3 className="text-success mb-0">₹{getTotalRepaidAll().toFixed(2)}</h3>
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
                  <h3 className="text-danger mb-0">₹{getTotalPending().toFixed(2)}</h3>
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
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter person's name"
                      value={borrower}
                      onChange={(e) => setBorrower(e.target.value)}
                    />
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
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loans Table */}
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
                <div className="card-body p-0">
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
                          const pending = loan.loanAmount - totalRepaid;
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
                                    ₹{loan.loanAmount.toFixed(2)}
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="fw-bold text-success fs-5 mb-1">
                                    ₹{totalRepaid.toFixed(2)}
                                  </div>
                                  {repayments[loan.id] && repayments[loan.id].length > 0 && (
                                    <button
                                      className="btn btn-sm btn-outline-info rounded-pill px-3"
                                      onClick={() => toggleHistory(loan.id)}
                                      title="View payment history"
                                    >
                                      <i className="fas fa-history me-1"></i>
                                      History
                                    </button>
                                  )}
                                </td>
                                <td className="py-4">
                                  <div className={`fw-bold fs-5 ${pending > 0 ? 'text-danger' : 'text-secondary'}`}>
                                    ₹{pending.toFixed(2)}
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
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              addRepayment(loan, e.target.value);
                                              e.target.value = "";
                                            }
                                          }}
                                        />
                                      </div>
                                      <button
                                        className="btn btn-success rounded-pill px-3"
                                        type="button"
                                        onClick={(e) => {
                                          const input = e.target.parentElement.querySelector('input');
                                          addRepayment(loan, input.value);
                                          input.value = "";
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
                                        onClick={() => markAsFullyPaid(loan)}
                                        title="Mark as fully paid"
                                      >
                                        <i className="fas fa-check me-1"></i>
                                        Mark Paid
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-outline-danger rounded-pill px-3"
                                      onClick={() => deleteLoan(loan)}
                                      title="Delete this record"
                                    >
                                      <i className="fas fa-trash me-1"></i>
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {/* Repayment History */}
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
                                                <td>₹{repayment.amount.toFixed(2)}</td>
                                                <td>
                                                  <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteRepayment(loan, repayment.id, repayment.amount)}
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