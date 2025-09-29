import React, { useState, useEffect,useCallback  } from 'react';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [expenseItems, setExpenseItems] = useState([
    {
      id: Date.now(),
      itemName: '',
      category: '',
      quantity: '',
      pricePerUnit: '',
      totalAmount: 0,
      unit: '',
      customItemName: '',
      showCustomInput: false
    }
  ]);

  const [currentDate] = useState(new Date().toISOString().split('T')[0]);

  // API Base URL - adjust according to your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Predefined items with their categories and units in Marathi
  const itemData = {
    'मैदा': { category: 'कच्चा माल', unit: 'किलो' },
    'साखर': { category: 'कच्चा माल', unit: 'किलो' },
    'तूप': { category: 'दुग्धजन्य', unit: 'किलो' },
    'तेल': { category: 'कच्चा माल', unit: 'लिटर' },
    'दूध': { category: 'दुग्धजन्य', unit: 'लिटर' },
    'यीस्ट': { category: 'बेकरी साहित्य', unit: 'किलो' }
  };

  const categories = [
    'कच्चा माल',
    'दुग्धजन्य',
    'बेकरी साहित्य',
    'पॅकेजिंग',
    'उपयोगिता',
    'उपकरणे',
    'वाहतूक',
    'मजुरी',
    'इतर'
  ];

  const units = [
    'किलो',
    'लिटर',
    'नग',
    'पॅकेट',
    'डबा',
    'बॅग'
  ];

  // Fetch expenses from backend
  const fetchExpenses =useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data);
      setError('');
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('खर्च लोड करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
 }, [API_BASE_URL]);

  // Load expenses when component mounts
  useEffect(() => {
    fetchExpenses();
}, [fetchExpenses]);

  const calculateTotal = (quantity, pricePerUnit) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(pricePerUnit) || 0;
    return qty * price;
  };

  const handleItemChange = (itemId, field, value) => {
    setExpenseItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          let updatedItem = { ...item };
          
          if (field === 'itemName') {
            if (value === 'Custom') {
              updatedItem = {
                ...updatedItem,
                itemName: value,
                category: '',
                unit: '',
                customItemName: '',
                showCustomInput: true
              };
            } else {
              const itemInfo = itemData[value] || { category: '', unit: '' };
              updatedItem = {
                ...updatedItem,
                itemName: value,
                category: itemInfo.category,
                unit: itemInfo.unit,
                customItemName: '',
                showCustomInput: false
              };
            }
          } else {
            updatedItem[field] = value;
          }

          // Recalculate total when quantity or price changes
          if (field === 'quantity' || field === 'pricePerUnit') {
            const newQuantity = field === 'quantity' ? value : updatedItem.quantity;
            const newPricePerUnit = field === 'pricePerUnit' ? value : updatedItem.pricePerUnit;
            updatedItem.totalAmount = calculateTotal(newQuantity, newPricePerUnit);
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const addNewItem = () => {
    const newItem = {
      id: Date.now(),
      itemName: '',
      category: '',
      quantity: '',
      pricePerUnit: '',
      totalAmount: 0,
      unit: '',
      customItemName: '',
      showCustomInput: false
    };
    setExpenseItems([...expenseItems, newItem]);
  };

  const removeItem = (itemId) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter(item => item.id !== itemId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = expenseItems.filter(item => {
      const finalItemName = item.itemName === 'Custom' ? item.customItemName : item.itemName;
      return finalItemName && item.category && item.quantity && item.pricePerUnit && item.unit;
    });

    if (validItems.length === 0) {
      setError('कृपया किमान एक वैध आयटम जोडा');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const expensesToSubmit = validItems.map(item => ({
        itemName: item.itemName === 'Custom' ? item.customItemName : item.itemName,
        category: item.category,
        quantity: parseFloat(item.quantity),
        pricePerUnit: parseFloat(item.pricePerUnit),
        unit: item.unit,
        date: currentDate
      }));

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenses: expensesToSubmit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add expenses');
      }

      setSuccess('खर्च यशस्वीपणे जतन झाला');
      
      // Refresh expenses list
      await fetchExpenses();
      
      // Reset form
      resetForm();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error adding expenses:', error);
      setError(`खर्च जतन करताना त्रुटी: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setExpenseItems([
      {
        id: Date.now(),
        itemName: '',
        category: '',
        quantity: '',
        pricePerUnit: '',
        totalAmount: 0,
        unit: '',
        customItemName: '',
        showCustomInput: false
      }
    ]);
    setError('');
    setSuccess('');
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + parseFloat(expense.totalAmount || 0), 0);
  };

  const getCurrentFormTotal = () => {
    return expenseItems.reduce((total, item) => total + (item.totalAmount || 0), 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hi-IN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('hi-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Show loading state
  if (loading && expenses.length === 0) {
    return (
      <div className="container-fluid py-4 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">खर्च लोड करत आहे...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h1 className="display-6 fw-bold text-dark mb-1">खर्च व्यवस्थापन</h1>
                <p className="text-muted mb-0">रिटेल मॅट्रिक्स - बेकरी व्यवसाय</p>
              </div>
              <div className="text-end">
                <div className="badge bg-primary fs-6 px-3 py-2">
                  एकूण खर्च: {formatCurrency(getTotalExpenses())}
                </div>
              </div>
            </div>
            <hr className="my-3" />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>त्रुटी!</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <strong>यश!</strong> {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        {/* Add Expense Form */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0 text-dark fw-semibold">
                    <i className="bi bi-plus-circle me-2"></i>नवे खर्च जोडा
                  </h5>
                  <div className="badge bg-success fs-6 px-3 py-1">
                    सध्याचा एकूण: {formatCurrency(getCurrentFormTotal())}
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div>
                  {expenseItems.map((item, index) => (
                    <div key={item.id} className="border rounded p-3 mb-3" style={{ backgroundColor: '#fefefe' }}>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0 text-primary fw-semibold">
                          <i className="bi bi-basket me-2"></i>आयटम #{index + 1}
                        </h6>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-info me-2 px-2 py-1">
                            एकूण: {formatCurrency(item.totalAmount || 0)}
                          </span>
                          {expenseItems.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            वस्तूचे नाव *
                          </label>
                          <select
                            className="form-select"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                            required
                          >
                            <option value="">वस्तू निवडा</option>
                            {Object.keys(itemData).map((itemName, idx) => (
                              <option key={idx} value={itemName}>
                                {itemName}
                              </option>
                            ))}
                            <option value="Custom">कस्टम (इतर)</option>
                          </select>
                        </div>

                        {item.showCustomInput && (
                          <div className="col-lg-3 col-md-6">
                            <label className="form-label fw-medium text-dark">
                              कस्टम नाव *
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={item.customItemName}
                              onChange={(e) => handleItemChange(item.id, 'customItemName', e.target.value)}
                              placeholder="वस्तूचे नाव लिहा"
                              required={item.showCustomInput}
                            />
                          </div>
                        )}

                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            श्रेणी *
                          </label>
                          {item.showCustomInput ? (
                            <select
                              className="form-select"
                              value={item.category}
                              onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                              required
                            >
                              <option value="">श्रेणी निवडा</option>
                              {categories.map((category, idx) => (
                                <option key={idx} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              value={item.category}
                              readOnly
                              placeholder="श्रेणी आपोआप भरली जाईल"
                              style={{ backgroundColor: '#f8f9fa' }}
                            />
                          )}
                        </div>

                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            एकक *
                          </label>
                          {item.showCustomInput ? (
                            <select
                              className="form-select"
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                              required
                            >
                              <option value="">एकक निवडा</option>
                              {units.map((unit, idx) => (
                                <option key={idx} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              value={item.unit}
                              readOnly
                              placeholder="एकक आपोआप भरले जाईल"
                              style={{ backgroundColor: '#f8f9fa' }}
                            />
                          )}
                        </div>

                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            प्रमाण *
                          </label>
                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                              placeholder="प्रमाण"
                              min="0"
                              step="0.1"
                              required
                            />
                            <span className="input-group-text">{item.unit}</span>
                          </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            दर प्रति एकक *
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              value={item.pricePerUnit}
                              onChange={(e) => handleItemChange(item.id, 'pricePerUnit', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                            <span className="input-group-text">प्रति {item.unit}</span>
                          </div>
                        </div>

                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            एकूण रक्कम
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">₹</span>
                            <input
                              type="text"
                              className="form-control fw-semibold"
                              value={item.totalAmount.toFixed(2)}
                              readOnly
                              style={{ backgroundColor: '#e8f5e8' }}
                            />
                          </div>
                          {item.quantity && item.pricePerUnit && (
                            <small className="text-muted">
                              {item.quantity} × ₹{item.pricePerUnit} = ₹{item.totalAmount.toFixed(2)}
                            </small>
                          )}
                        </div>

                        <div className="col-lg-3 col-md-6">
                          <label className="form-label fw-medium text-dark">
                            तारीख
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={currentDate}
                            readOnly
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="row mt-4">
                    <div className="col-12">
                      <button 
                        type="button" 
                        className="btn btn-outline-primary me-3"
                        onClick={addNewItem}
                      >
                        <i className="bi bi-plus-circle me-2"></i>आणखी आयटम जोडा
                      </button>
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-lg px-4 me-3"
                        onClick={handleSubmit}
                      >
                        <i className="bi bi-check-circle me-2"></i>सर्व खर्च जतन करा
                      </button>
                      
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary btn-lg px-4"
                        onClick={resetForm}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>रीसेट
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0 text-dark fw-semibold">
                    <i className="bi bi-table me-2"></i>खर्चाची नोंद
                  </h5>
                  <span className="badge bg-light text-dark">
                    {expenses.length} {expenses.length === 1 ? 'नोंद' : 'नोंदी'}
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4 py-3 fw-semibold text-dark">#</th>
                        <th className="px-4 py-3 fw-semibold text-dark">वस्तूचे नाव</th>
                        <th className="px-4 py-3 fw-semibold text-dark">श्रेणी</th>
                        <th className="px-4 py-3 fw-semibold text-dark text-center">प्रमाण</th>
                        <th className="px-4 py-3 fw-semibold text-dark text-center">दर</th>
                        <th className="px-4 py-3 fw-semibold text-dark text-end">एकूण रक्कम</th>
                        <th className="px-4 py-3 fw-semibold text-dark">तारीख</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <i className="bi bi-inbox display-1 d-block mb-3 text-light"></i>
                            अजून कोणताही खर्च नोंदविलेला नाही. वरील फॉर्म वापरून पहिला खर्च जोडा.
                          </td>
                        </tr>
                      ) : (
                        expenses.map((expense, index) => (
                          <tr key={expense.id} className="border-bottom">
                            <td className="px-4 py-3 text-muted fw-medium">{index + 1}</td>
                            <td className="px-4 py-3 fw-medium text-dark">{expense.itemName}</td>
                            <td className="px-4 py-3">
                              <span className={`badge ${
                                expense.category === 'कच्चा माल' ? 'bg-success' :
                                expense.category === 'दुग्धजन्य' ? 'bg-info' :
                                expense.category === 'उपयोगिता' ? 'bg-warning text-dark' :
                                expense.category === 'बेकरी साहित्य' ? 'bg-primary' :
                                'bg-secondary'
                              } px-2 py-1`}>
                                {expense.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="fw-medium">{expense.quantity}</span>
                              <small className="text-muted d-block">{expense.unit}</small>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="fw-medium">{formatCurrency(expense.pricePerUnit)}</span>
                              <small className="text-muted d-block">प्रति {expense.unit}</small>
                            </td>
                            <td className="px-4 py-3 text-end fw-semibold text-dark">
                              {formatCurrency(expense.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-muted">{formatDate(expense.date)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {expenses.length > 0 && (
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="5" className="px-4 py-3 fw-bold text-dark">एकूण खर्च</td>
                          <td className="px-4 py-3 text-end fw-bold text-primary fs-5">
                            {formatCurrency(getTotalExpenses())}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagement;