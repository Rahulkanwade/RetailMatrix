import React, { useState } from "react";

export default function PavWholesaleManagement() {
  const [customers, setCustomers] = useState([]);
  const [savedCustomers, setSavedCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    dozenQty: 0,
    pricePerDozen: 60,
    dateTime: new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    paidAmount: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paymentStatus: 'pending'
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Add or update customer
  const addCustomer = () => {
    if (!newCustomer.name || newCustomer.dozenQty <= 0) {
      alert("Please enter valid details");
      return;
    }

    const totalAmount = newCustomer.dozenQty * newCustomer.pricePerDozen;
    const customerData = {
      ...newCustomer,
      totalAmount,
      pendingAmount: totalAmount - newCustomer.paidAmount,
      paymentStatus: newCustomer.paidAmount >= totalAmount ? 'paid' : 'pending'
    };

    // Save customer name and contact for future suggestions
    const customerExists = savedCustomers.find(sc => 
      sc.name.toLowerCase() === newCustomer.name.toLowerCase()
    );
    
    if (!customerExists) {
      setSavedCustomers(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: newCustomer.name,
        contact: newCustomer.contact
      }]);
    }

    if (editingCustomer) {
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...customerData, id: editingCustomer.id } : c
        )
      );
      setEditingCustomer(null);
    } else {
      setCustomers([...customers, { ...customerData, id: Date.now() }]);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewCustomer({
      name: "",
      contact: "",
      dozenQty: 0,
      pricePerDozen: 60,
      dateTime: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      paidAmount: 0,
      totalAmount: 0,
      pendingAmount: 0,
      paymentStatus: 'pending'
    });
    setShowSuggestions(false);
  };

  const editCustomer = (customer) => {
    setNewCustomer(customer);
    setEditingCustomer(customer);
  };

  const deleteCustomer = (id) => {
    if (window.confirm("Delete this customer entry?")) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const selectSuggestedCustomer = (savedCustomer) => {
    setNewCustomer({
      ...newCustomer,
      name: savedCustomer.name,
      contact: savedCustomer.contact
    });
    setShowSuggestions(false);
  };

  const openPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
    setPaymentAmount("");
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedCustomer(null);
    setPaymentAmount("");
  };

  const submitPayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const payment = Number(paymentAmount);
    const updatedCustomer = {
      ...selectedCustomer,
      paidAmount: selectedCustomer.paidAmount + payment,
      pendingAmount: selectedCustomer.pendingAmount - payment
    };
    
    updatedCustomer.paymentStatus = updatedCustomer.pendingAmount <= 0 ? 'paid' : 'partial';

    setCustomers(customers.map(c => 
      c.id === selectedCustomer.id ? updatedCustomer : c
    ));

    closePaymentModal();
    alert(`Payment of ₹${payment} added successfully!`);
  };

  // Filter suggestions based on input
  const filteredSuggestions = savedCustomers.filter(sc =>
    sc.name.toLowerCase().includes(newCustomer.name.toLowerCase()) && 
    newCustomer.name.length > 0
  );

  // Search filter for customer list
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.includes(search)
  );

  // Daily total calculation
  const totalDozens = filteredCustomers.reduce((sum, c) => sum + Number(c.dozenQty), 0);
  const totalPavs = totalDozens * 12;
  const totalRevenue = filteredCustomers.reduce(
    (sum, c) => sum + c.dozenQty * c.pricePerDozen,
    0
  );
  const totalPaid = filteredCustomers.reduce((sum, c) => sum + c.paidAmount, 0);
  const totalPending = filteredCustomers.reduce((sum, c) => sum + c.pendingAmount, 0);

  return (
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      {/* Header */}
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-4 text-white">
              <h1 className="display-4 fw-bold mb-2">🥖 PAV Wholesale Manager</h1>
              <p className="lead mb-0">Manage your daily PAV wholesale business efficiently</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid px-3 px-md-4 pb-4">
        <div className="row g-4">
          {/* Add Customer Form */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-lg border-0 h-100" style={{borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)'}}>
              <div className="card-header border-0 text-white text-center py-3" style={{background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '20px 20px 0 0'}}>
                <h5 className="mb-0 fw-bold">
                  {editingCustomer ? "✏️ Edit Customer" : "➕ Add New Customer"}
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold text-dark">👤 Customer Name *</label>
                  <input
                    className="form-control form-control-lg border-0 shadow-sm"
                    type="text"
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChange={(e) => {
                      setNewCustomer({ ...newCustomer, name: e.target.value });
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowSuggestions(newCustomer.name.length > 0)}
                    style={{borderRadius: '15px', backgroundColor: '#f8f9ff'}}
                  />
                  
                  {/* Customer Suggestions Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="position-absolute w-100 mt-1" style={{zIndex: 1000}}>
                      <div className="card border-0 shadow-lg" style={{borderRadius: '15px'}}>
                        <div className="card-body p-2">
                          <small className="text-muted fw-semibold px-2">💡 Previous Customers:</small>
                          {filteredSuggestions.map((sc) => (
                            <div
                              key={sc.id}
                              className="d-flex align-items-center p-2 rounded-3 cursor-pointer hover-bg-light"
                              onClick={() => selectSuggestedCustomer(sc)}
                              style={{cursor: 'pointer'}}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9ff'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <div className="me-2">👤</div>
                              <div className="flex-grow-1">
                                <div className="fw-semibold text-dark">{sc.name}</div>
                                <small className="text-muted">{sc.contact}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">📱 Contact Number</label>
                  <input
                    className="form-control form-control-lg border-0 shadow-sm"
                    type="tel"
                    placeholder="Enter contact number"
                    value={newCustomer.contact}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                    style={{borderRadius: '15px', backgroundColor: '#f8f9ff'}}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">📦 Daily Quantity (Dozens) *</label>
                  <input
                    className="form-control form-control-lg border-0 shadow-sm"
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="Enter dozens quantity"
                    value={newCustomer.dozenQty}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, dozenQty: Number(e.target.value) })
                    }
                    style={{borderRadius: '15px', backgroundColor: '#f8f9ff'}}
                  />
                  {newCustomer.dozenQty > 0 && (
                    <div className="mt-2 p-2 rounded-3" style={{backgroundColor: '#e3f2fd'}}>
                      <small className="text-primary fw-semibold">
                        = {newCustomer.dozenQty * 12} individual pavs
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">💰 Price per Dozen (₹)</label>
                  <input
                    className="form-control form-control-lg border-0 shadow-sm"
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="Price per dozen"
                    value={newCustomer.pricePerDozen}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, pricePerDozen: Number(e.target.value) })
                    }
                    style={{borderRadius: '15px', backgroundColor: '#f8f9ff'}}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">💳 Initial Payment (₹)</label>
                  <input
                    className="form-control form-control-lg border-0 shadow-sm"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Amount paid upfront (optional)"
                    value={newCustomer.paidAmount}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, paidAmount: Number(e.target.value) })
                    }
                    style={{borderRadius: '15px', backgroundColor: '#f8f9ff'}}
                  />
                  {newCustomer.dozenQty > 0 && newCustomer.pricePerDozen > 0 && (
                    <div className="mt-2 p-2 rounded-3" style={{backgroundColor: '#fff3cd'}}>
                      <small className="text-dark">
                        Total Bill: ₹{newCustomer.dozenQty * newCustomer.pricePerDozen} | 
                        Pending: ₹{(newCustomer.dozenQty * newCustomer.pricePerDozen) - newCustomer.paidAmount}
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-lg fw-bold text-white border-0 shadow" 
                    onClick={addCustomer}
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '15px'}}
                  >
                    {editingCustomer ? "🔄 Update Customer" : "✅ Add Customer"}
                  </button>
                  
                  {editingCustomer && (
                    <button 
                      className="btn btn-outline-secondary btn-lg fw-bold border-0 shadow-sm" 
                      onClick={() => {
                        setEditingCustomer(null);
                        resetForm();
                      }}
                      style={{borderRadius: '15px'}}
                    >
                      ❌ Cancel Edit
                    </button>
                  )}
                </div>

                {/* Show suggestions hint */}
                {savedCustomers.length > 0 && (
                  <div className="mt-3 p-2 rounded-3" style={{backgroundColor: '#fff3cd'}}>
                    <small className="text-warning-emphasis">
                      💡 Start typing a name to see previous customers
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customers List */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-lg border-0 h-100" style={{borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)'}}>
              <div className="card-header border-0 text-white py-3" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0'}}>
                <div className="row align-items-center g-3">
                  <div className="col-12 col-md-6">
                    <h4 className="mb-0 fw-bold">🏪 Today's Orders</h4>
                  </div>
                  <div className="col-12 col-md-6">
                    <input
                      className="form-control form-control-lg border-0 shadow-sm"
                      type="text"
                      placeholder="🔍 Search customers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{borderRadius: '25px', backgroundColor: 'rgba(255,255,255,0.9)'}}
                    />
                  </div>
                </div>
              </div>
              
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{backgroundColor: '#f8f9ff'}}>
                      <tr>
                        <th className="fw-bold text-dark border-0 py-3 px-4">Customer Info</th>
                        <th className="fw-bold text-dark border-0 py-3 d-none d-md-table-cell">Contact</th>
                        <th className="fw-bold text-dark border-0 py-3">Date & Time</th>
                        <th className="fw-bold text-dark border-0 py-3">Quantity</th>
                        <th className="fw-bold text-dark border-0 py-3">Payment</th>
                        <th className="fw-bold text-dark border-0 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="fw-bold text-dark mb-1">{c.name}</div>
                              <div className="d-md-none mt-1">
                                <small className="text-primary">📱 {c.contact}</small>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 d-none d-md-table-cell">
                            <span className="text-primary">{c.contact}</span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex flex-column">
                              <small className="text-dark fw-semibold">
                                📅 {c.dateTime.split(',')[0]}
                              </small>
                              <small className="text-muted">
                                🕐 {c.dateTime.split(',')[1]}
                              </small>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex flex-column gap-1">
                              <span className="badge fs-6 px-3 py-2" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '20px'}}>
                                {c.dozenQty} Dozens
                              </span>
                              <small className="text-muted">({c.dozenQty * 12} pavs)</small>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex flex-column gap-1">
                              <span className="text-dark fw-bold">₹{c.totalAmount} Total</span>
                              <span className={`badge fs-6 px-2 py-1 ${c.paymentStatus === 'paid' ? 'bg-success' : c.paymentStatus === 'partial' ? 'bg-warning' : 'bg-danger'}`} style={{borderRadius: '10px'}}>
                                {c.paymentStatus === 'paid' ? '✅ Paid' : 
                                 c.paymentStatus === 'partial' ? '⚠️ Partial' : '❌ Pending'}
                              </span>
                              {c.pendingAmount > 0 && (
                                <small className="text-danger fw-semibold">Due: ₹{c.pendingAmount}</small>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex flex-column gap-2">
                              <button
                                className="btn btn-sm btn-warning text-white fw-semibold border-0 shadow-sm"
                                onClick={() => editCustomer(c)}
                                style={{borderRadius: '10px', minWidth: '80px'}}
                              >
                                ✏️ Edit
                              </button>
                              {c.pendingAmount > 0 && (
                                <button
                                  className="btn btn-sm btn-success text-white fw-semibold border-0 shadow-sm"
                                  onClick={() => openPaymentModal(c)}
                                  style={{borderRadius: '10px', minWidth: '80px'}}
                                >
                                  💳 Pay
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-danger fw-semibold border-0 shadow-sm"
                                onClick={() => deleteCustomer(c.id)}
                                style={{borderRadius: '10px', minWidth: '80px'}}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center p-5">
                    <div className="display-1 mb-3">😔</div>
                    <h5 className="text-muted mb-0">
                      {search ? "No customers found matching your search." : "No customers added yet. Add your first customer!"}
                    </h5>
                  </div>
                )}
              </div>
              
              <div className="card-footer border-0 text-white py-3" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '0 0 20px 20px'}}>
                <div className="row text-center g-3">
                  <div className="col-6 col-md-2">
                    <div className="fw-bold fs-6">📦 {totalDozens}</div>
                    <small>Dozens</small>
                  </div>
                  <div className="col-6 col-md-2">
                    <div className="fw-bold fs-6">🥖 {totalPavs}</div>
                    <small>Pavs</small>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="fw-bold fs-5">💰 ₹{totalRevenue}</div>
                    <small>Total Revenue</small>
                  </div>
                  <div className="col-6 col-md-2">
                    <div className="fw-bold fs-6 text-success">✅ ₹{totalPaid}</div>
                    <small>Paid</small>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="fw-bold fs-5 text-warning">⏳ ₹{totalPending}</div>
                    <small>Pending Payment</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedCustomer && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{borderRadius: '20px'}}>
                <div className="modal-header border-0 text-white py-3" style={{background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '20px 20px 0 0'}}>
                  <h5 className="modal-title fw-bold">💳 Add Payment - {selectedCustomer.name}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closePaymentModal}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3 p-3 rounded-3" style={{backgroundColor: '#f8f9ff'}}>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="fw-bold text-dark">Total Bill</div>
                        <div className="fs-5 text-primary">₹{selectedCustomer.totalAmount}</div>
                      </div>
                      <div className="col-4">
                        <div className="fw-bold text-success">Already Paid</div>
                        <div className="fs-5 text-success">₹{selectedCustomer.paidAmount}</div>
                      </div>
                      <div className="col-4">
                        <div className="fw-bold text-danger">Pending</div>
                        <div className="fs-5 text-danger">₹{selectedCustomer.pendingAmount}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">💰 Payment Amount</label>
                    <input
                      type="number"
                      className="form-control form-control-lg border-0 shadow-sm"
                      placeholder="Enter payment amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      max={selectedCustomer.pendingAmount}
                      style={{borderRadius: '15px', backgroundColor: '#f8f9ff'}}
                    />
                    <small className="text-muted">Maximum: ₹{selectedCustomer.pendingAmount}</small>
                  </div>

                  {paymentAmount && (
                    <div className="p-3 rounded-3" style={{backgroundColor: Number(paymentAmount) >= selectedCustomer.pendingAmount ? '#d1edff' : '#fff3cd'}}>
                      <div className="text-center">
                        <strong>
                          {Number(paymentAmount) >= selectedCustomer.pendingAmount ? 
                            '✅ Full Payment - Account will be cleared!' :
                            `⚠️ Remaining Pending: ₹${selectedCustomer.pendingAmount - Number(paymentAmount)}`
                          }
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0 p-4">
                  <button type="button" className="btn btn-outline-secondary btn-lg" onClick={closePaymentModal} style={{borderRadius: '15px'}}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-lg fw-bold text-white border-0 shadow" 
                    onClick={submitPayment}
                    disabled={!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > selectedCustomer.pendingAmount}
                    style={{background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '15px'}}
                  >
                    💳 Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}