import React, { useState, useEffect, useMemo, useCallback } from 'react';

export default function EnhancedSupplierManagement() {
    // State management
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Predefined suppliers list (for reference/quick add)
    const predefinedSuppliers = [
        {
            id: 1,
            name: "पडतानी मिल",
            contact: "+919876543210",
            address: "मालपाणी हेल्थ क्लब, रोड, कासारवाडी, संगमनेर, महाराष्ट्र ४२२६०५"
        },
        {
            id: 2,
            name: "तापडे",
            contact: "+919850557700",
            address: "अकोले बायपास Rd, संगमनेर, महाराष्ट्र"
        },
        {
            id: 3,
            name: "श्री साई ट्रेडर्स / पवार",
            contact: "+919822760071",
            address: "लिंक रोड, बागवान पुरा, संगमनेर, महाराष्ट्र"
        }
    ];

    // Product categories
    const productCategories = [
        { id: 1, name: "खाद्य सामग्री (Food Items)", icon: "🍽️" },
        { id: 2, name: "पैकेजिंग सामग्री (Packaging)", icon: "📦" },
        { id: 3, name: "दुग्ध उत्पाद (Dairy)", icon: "🥛" },
        { id: 4, name: "मसाले (Spices)", icon: "🌶️" },
        { id: 5, name: "अन्य (Other)", icon: "📋" }
    ];

    // Common products
    const commonProducts = [
        { value: "मैदा (Flour)", label: "मैदा (Flour)", category: 1 },
        { value: "साखर (Sugar)", label: "साखर (Sugar)", category: 1 },
        { value: "तेल (Oil)", label: "तेल (Oil)", category: 1 },
        { value: "बेकिंग पाउडर (Baking Powder)", label: "बेकिंग पाउडर (Baking Powder)", category: 1 },
        { value: "डिब्बे (Containers)", label: "डिब्बे (Containers)", category: 2 },
        { value: "दूध (Milk)", label: "दूध (Milk)", category: 3 },
        { value: "इलायची (Cardamom)", label: "इलायची (Cardamom)", category: 4 },
    ];

    // Form states
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        contact: "",
        address: "",
        products: [],
        billDate: new Date().toISOString().split('T')[0]
    });

    // UI states
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [useCustomProduct, setUseCustomProduct] = useState(false);
    const [useExistingSupplier, setUseExistingSupplier] = useState(false);
    const [selectedExistingSupplier, setSelectedExistingSupplier] = useState("");
    const [contactError, setContactError] = useState("");

    // Advanced features states
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");

    // Product addition states
    const [newProduct, setNewProduct] = useState({
        name: "",
        quantity: 0,
        unit: "packet",
        price: 0,
        category: 1
    });

    // API Base URL
    const API_BASE = 'http://localhost:5000';

    const apiCall = useCallback(async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }, [API_BASE]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!isMounted) return;

            try {
                setLoading(true);
                setError("");
                const data = await apiCall('/suppliers');

                if (isMounted) {
                    const suppliersWithProducts = await Promise.all(
                        data.map(async (supplier) => {
                            try {
                                const productsData = await apiCall(`/suppliers/${supplier.id}/products`);
                                return {
                                    ...supplier,
                                    products: Array.isArray(productsData) ? productsData : []
                                };
                            } catch (error) {
                                console.warn(`Could not load products for supplier ${supplier.id}:`, error);
                                return {
                                    ...supplier,
                                    products: []
                                };
                            }
                        })
                    );

                    if (isMounted) {
                        setSuppliers(suppliersWithProducts);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setError(`Failed to load suppliers: ${error.message}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [apiCall]);

    const formatDateForInput = (dateString) => {
        if (!dateString) return new Date().toISOString().split('T')[0];

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };

    const handleContactChange = (e) => {
        let value = e.target.value;
        const cleanValue = value.replace(/[^\d+]/g, '');

        if (!cleanValue.startsWith("+91")) {
            value = "+91" + cleanValue.replace(/\+/g, '');
        } else {
            value = cleanValue;
        }

        if (value.length > 13) {
            value = value.slice(0, 13);
        }

        setNewSupplier({ ...newSupplier, contact: value });

        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(value)) {
            setContactError("Contact number must be +91 followed by 10 digits.");
        } else {
            setContactError("");
        }
    };

    const handleExistingSupplierSelection = (supplierId) => {
        if (!supplierId) return;

        const supplier = predefinedSuppliers.find(s => s.id.toString() === supplierId);
        if (supplier) {
            setNewSupplier({
                name: supplier.name,
                contact: supplier.contact,
                address: supplier.address,
                products: [],
                billDate: new Date().toISOString().split('T')[0]
            });
        }
    };

    const memoizedCalculateSupplierValue = useCallback((supplier) => {
        const products = supplier?.products;
        if (!Array.isArray(products)) return 0;

        return products.reduce((total, product) => {
            const price = Number(product.price) || 0;
            const quantity = Number(product.quantity) || 0;
            return total + (price * quantity);
        }, 0);
    }, []);

    const addSupplier = async () => {
        if (!newSupplier.name.trim()) {
            setError("Supplier name is required");
            return;
        }
        if (!newSupplier.contact.trim()) {
            setError("Contact number is required");
            return;
        }
        if (contactError) {
            setError("Please fix contact number format");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const supplierData = {
                name: newSupplier.name.trim(),
                contact: newSupplier.contact,
                address: newSupplier.address || "",
                billDate: newSupplier.billDate,
                products: newSupplier.products
            };

            if (isEditing && selectedSupplier) {
                await apiCall(`/suppliers/${selectedSupplier.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(supplierData)
                });
                setIsEditing(false);
                setSelectedSupplier(null);
            } else {
                await apiCall('/suppliers', {
                    method: 'POST',
                    body: JSON.stringify(supplierData)
                });
            }

            setNewSupplier({
                name: "",
                contact: "",
                address: "",
                products: [],
                billDate: new Date().toISOString().split('T')[0]
            });
            setSelectedExistingSupplier("");
            setUseExistingSupplier(false);

            const data = await apiCall('/suppliers');
            const suppliersWithProducts = await Promise.all(
                data.map(async (supplier) => {
                    try {
                        const productsData = await apiCall(`/suppliers/${supplier.id}/products`);
                        return {
                            ...supplier,
                            products: Array.isArray(productsData) ? productsData : []
                        };
                    } catch (error) {
                        return { ...supplier, products: [] };
                    }
                })
            );
            setSuppliers(suppliersWithProducts);

        } catch (error) {
            setError(`Failed to ${isEditing ? 'update' : 'add'} supplier: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteSupplier = async (supplierId) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            await apiCall(`/suppliers/${supplierId}`, {
                method: 'DELETE'
            });

            const data = await apiCall('/suppliers');
            const suppliersWithProducts = await Promise.all(
                data.map(async (supplier) => {
                    try {
                        const productsData = await apiCall(`/suppliers/${supplier.id}/products`);
                        return {
                            ...supplier,
                            products: Array.isArray(productsData) ? productsData : []
                        };
                    } catch (error) {
                        return { ...supplier, products: [] };
                    }
                })
            );
            setSuppliers(suppliersWithProducts);

        } catch (error) {
            setError(`Failed to delete supplier: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const removeProductFromEdit = (productIndex) => {
        const updatedProducts = newSupplier.products.filter((_, index) => index !== productIndex);
        setNewSupplier({
            ...newSupplier,
            products: updatedProducts
        });
    };

    const editSupplier = async (supplier) => {
        let isMounted = true;

        try {
            setLoading(true);
            setError("");

            let supplierWithProducts;
            try {
                supplierWithProducts = await apiCall(`/suppliers/${supplier.id}`);
            } catch (error) {
                console.warn('Could not fetch detailed supplier data, using existing data:', error);
                supplierWithProducts = supplier;
            }

            if (!isMounted) return;

            const products = Array.isArray(supplierWithProducts.products) ? supplierWithProducts.products : [];
            const formattedDate = formatDateForInput(supplierWithProducts.billDate);

            setNewSupplier({
                name: supplierWithProducts.name || "",
                contact: supplierWithProducts.contact || "",
                address: supplierWithProducts.address || "",
                billDate: formattedDate,
                products: products
            });

            setIsEditing(true);
            setSelectedSupplier(supplierWithProducts);
            setContactError("");

        } catch (error) {
            if (isMounted) {
                setError(`Failed to load supplier for editing: ${error.message}`);
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };

    const addProduct = () => {
        if (!newProduct.name.trim() || newProduct.quantity <= 0 || newProduct.price <= 0) {
            setError("Please enter valid product details including price");
            return;
        }

        const updatedProducts = [...newSupplier.products, { ...newProduct }];

        setNewSupplier({
            ...newSupplier,
            products: updatedProducts,
        });

        setNewProduct({
            name: "",
            quantity: 0,
            unit: "packet",
            price: 0,
            category: 1
        });
        setError("");
    };

    const handleProductSelection = (value) => {
        const selectedProduct = commonProducts.find(p => p.value === value);
        if (selectedProduct) {
            setNewProduct({
                ...newProduct,
                name: value,
                category: selectedProduct.category
            });
        } else {
            setNewProduct({ ...newProduct, name: value });
        }
    };

    const toggleProductEntry = () => {
        setUseCustomProduct(!useCustomProduct);
        setNewProduct({
            ...newProduct,
            name: "",
            category: 1
        });
    };

    const toggleSupplierEntry = () => {
        setUseExistingSupplier(!useExistingSupplier);
        setNewSupplier({
            name: "",
            contact: "",
            address: "",
            products: [],
            billDate: new Date().toISOString().split('T')[0]
        });
        setSelectedExistingSupplier("");
    };

    const filteredSuppliers = useMemo(() => {
        if (!Array.isArray(suppliers)) return [];
        
        return suppliers
            .filter(supplier => {
                const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (supplier.address && supplier.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    supplier.contact.includes(searchTerm);
                return matchesSearch;
            })
            .sort((a, b) => {
                if (sortField === "name") {
                    return sortDirection === "asc"
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                } else if (sortField === "date") {
                    return sortDirection === "asc"
                        ? new Date(a.billDate) - new Date(b.billDate)
                        : new Date(b.billDate) - new Date(a.billDate);
                }
                return 0;
            });
    }, [suppliers, searchTerm, sortField, sortDirection]);

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const fetchSupplierProducts = async (supplier) => {
        let isMounted = true;

        try {
            setLoadingProducts(true);
            setError("");
            setSelectedSupplier({ ...supplier, products: [] });

            const productsData = await apiCall(`/suppliers/${supplier.id}/products`);

            if (isMounted) {
                setSelectedSupplier(prev => ({
                    ...prev,
                    products: Array.isArray(productsData) ? productsData : []
                }));
            }

        } catch (error) {
            if (isMounted) {
                setError(`Failed to load products: ${error.message}`);
                setSelectedSupplier(null);
            }
        } finally {
            if (isMounted) {
                setLoadingProducts(false);
            }
        }
    };

    return (
        <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-white mb-2">Supplier Management System</h1>
                    <p className="text-white-50 fs-5">Efficiently manage your supplier relationships and inventory</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show mx-auto mb-4 shadow-sm" role="alert" style={{maxWidth: '800px'}}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError("")}></button>
                    </div>
                )}

                {/* Global Loading Indicator */}
                {loading && (
                    <div className="d-flex justify-content-center mb-4">
                        <div className="spinner-border text-white" role="status" style={{width: '3rem', height: '3rem'}}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}

                <div className="row g-4">
                    {/* Supplier Form */}
                    <div className="col-xl-4 col-lg-5">
                        <div className="card shadow-lg border-0 rounded-4 h-100">
                            <div className="card-header border-0 rounded-top-4" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h3 className="mb-0 text-white fw-bold">
                                        {isEditing ? (
                                            <>
                                                <i className="fas fa-edit me-2"></i>
                                                Edit Supplier
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-plus-circle me-2"></i>
                                                Add Supplier
                                            </>
                                        )}
                                    </h3>
                                    {!isEditing && (
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="supplierTypeSwitch"
                                                checked={useExistingSupplier}
                                                onChange={toggleSupplierEntry}
                                                style={{width: '3rem', height: '1.5rem'}}
                                            />
                                            <label className="form-check-label text-white fw-semibold ms-2" htmlFor="supplierTypeSwitch">
                                                Use Template
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="card-body p-4">
                                <form>
                                    {useExistingSupplier && !isEditing && (
                                        <div className="mb-4">
                                            <label className="form-label fw-semibold text-muted">
                                                <i className="fas fa-clipboard-list me-2"></i>
                                                Select Template
                                            </label>
                                            <select
                                                className="form-select form-select-lg border-0 shadow-sm"
                                                value={selectedExistingSupplier}
                                                onChange={(e) => {
                                                    setSelectedExistingSupplier(e.target.value);
                                                    handleExistingSupplierSelection(e.target.value);
                                                }}
                                                style={{backgroundColor: '#f8f9fa'}}
                                            >
                                                <option value="">-- Select Supplier --</option>
                                                {predefinedSuppliers.map((supplier) => (
                                                    <option key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-muted">
                                            <i className="fas fa-building me-2"></i>
                                            Supplier Name *
                                        </label>
                                        <input
                                            className="form-control form-control-lg border-0 shadow-sm"
                                            type="text"
                                            placeholder="Enter supplier name"
                                            value={newSupplier.name}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                            required
                                            disabled={useExistingSupplier && selectedExistingSupplier}
                                            style={{backgroundColor: '#f8f9fa'}}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-muted">
                                            <i className="fas fa-phone me-2"></i>
                                            Contact Number *
                                        </label>
                                        <input
                                            className="form-control form-control-lg border-0 shadow-sm"
                                            type="tel"
                                            placeholder="+91XXXXXXXXXX"
                                            value={newSupplier.contact}
                                            onChange={handleContactChange}
                                            required
                                            style={{backgroundColor: '#f8f9fa'}}
                                        />
                                        {contactError && (
                                            <div className="text-danger mt-2 small fw-medium">
                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                {contactError}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-muted">
                                            <i className="fas fa-map-marker-alt me-2"></i>
                                            Address
                                        </label>
                                        <textarea
                                            className="form-control border-0 shadow-sm"
                                            rows="3"
                                            placeholder="Enter complete address"
                                            value={newSupplier.address}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                            style={{backgroundColor: '#f8f9fa', resize: 'none'}}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-muted">
                                            <i className="fas fa-calendar me-2"></i>
                                            Bill Date
                                        </label>
                                        <input
                                            className="form-control form-control-lg border-0 shadow-sm"
                                            type="date"
                                            value={newSupplier.billDate}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, billDate: e.target.value })}
                                            style={{backgroundColor: '#f8f9fa'}}
                                        />
                                    </div>

                                    {/* Product Addition Section */}
                                    <div className="card border-0 shadow-sm mb-4" style={{backgroundColor: '#f1f3f4'}}>
                                        <div className="card-header border-0" style={{backgroundColor: 'transparent'}}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="mb-0 fw-bold text-dark">
                                                    <i className="fas fa-box me-2"></i>
                                                    Add Product
                                                </h5>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="productTypeSwitch"
                                                        checked={useCustomProduct}
                                                        onChange={toggleProductEntry}
                                                    />
                                                    <label className="form-check-label fw-medium" htmlFor="productTypeSwitch">
                                                        Custom
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="card-body">
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    {useCustomProduct ? (
                                                        <input
                                                            className="form-control border-0 shadow-sm"
                                                            type="text"
                                                            placeholder="Product Name"
                                                            value={newProduct.name}
                                                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                                            style={{backgroundColor: '#ffffff'}}
                                                        />
                                                    ) : (
                                                        <select
                                                            className="form-select border-0 shadow-sm"
                                                            value={newProduct.name}
                                                            onChange={(e) => handleProductSelection(e.target.value)}
                                                            style={{backgroundColor: '#ffffff'}}
                                                        >
                                                            <option value="">-- Select Product --</option>
                                                            {commonProducts.map((product, index) => (
                                                                <option key={index} value={product.value}>
                                                                    {product.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                                
                                                <div className="col-12">
                                                    <select
                                                        className="form-select border-0 shadow-sm"
                                                        value={newProduct.category}
                                                        onChange={(e) => setNewProduct({ ...newProduct, category: Number(e.target.value) })}
                                                        style={{backgroundColor: '#ffffff'}}
                                                    >
                                                        {productCategories.map(category => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.icon} {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <div className="col-4">
                                                    <input
                                                        className="form-control border-0 shadow-sm"
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={newProduct.quantity}
                                                        onChange={(e) => {
                                                            const value = Number(e.target.value);
                                                            setNewProduct({ ...newProduct, quantity: Math.max(0, value) });
                                                        }}
                                                        min="0"
                                                        style={{backgroundColor: '#ffffff'}}
                                                    />
                                                </div>
                                                
                                                <div className="col-4">
                                                    <select
                                                        className="form-select border-0 shadow-sm"
                                                        value={newProduct.unit}
                                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                                        style={{backgroundColor: '#ffffff'}}
                                                    >
                                                        <option value="kg">किलो</option>
                                                        <option value="liter">लिटर</option>
                                                        <option value="g">ग्रॅम</option>
                                                        <option value="packet">कट्टा</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="col-4">
                                                    <div className="input-group">
                                                        <span className="input-group-text border-0 shadow-sm" style={{backgroundColor: '#ffffff'}}>₹</span>
                                                        <input
                                                            className="form-control border-0 shadow-sm"
                                                            type="number"
                                                            placeholder="Price"
                                                            value={newProduct.price}
                                                            onChange={(e) => {
                                                                const value = Number(e.target.value);
                                                                setNewProduct({ ...newProduct, price: Math.max(0, value) });
                                                            }}
                                                            min="0"
                                                            style={{backgroundColor: '#ffffff'}}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm mt-3 px-4 rounded-pill shadow-sm"
                                                onClick={addProduct}
                                                style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
                                            >
                                                <i className="fas fa-plus me-2"></i>
                                                Add Product
                                            </button>

                                            {/* Display added products */}
                                            {newSupplier.products.length > 0 && (
                                            <div className="border rounded-3 p-3" style={{backgroundColor: '#ffffff'}}>
                                                    <h6 className="fw-bold text-dark mb-3">
                                                        <i className="fas fa-list-ul me-2"></i>
                                                        Added Products ({newSupplier.products.length})
                                                    </h6>
                                                    <div className="max-height-200 overflow-auto">
                                                        {newSupplier.products.map((product, index) => {
                                                            const category = productCategories.find(c => c.id === product.category);
                                                            const totalPrice = product.quantity * product.price;
                                                            
                                                            return (
                                                                <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                                    <div className="flex-grow-1">
                                                                        <div className="d-flex align-items-center mb-1">
                                                                            <span className="me-2">{category?.icon || "📦"}</span>
                                                                            <span className="fw-medium text-dark">{product.name}</span>
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            {product.quantity} {product.unit} × ₹{product.price} = 
                                                                            <span className="fw-bold text-success ms-1">₹{totalPrice}</span>
                                                                        </small>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-danger rounded-circle ms-2"
                                                                        onClick={() => removeProductFromEdit(index)}
                                                                        style={{width: '32px', height: '32px'}}
                                                                    >
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* Total Value */}
                                                    <div className="mt-3 pt-3 border-top">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <span className="fw-bold text-dark">Total Value:</span>
                                                            <span className="fs-5 fw-bold text-primary">
                                                                ₹{newSupplier.products.reduce((total, p) => total + (p.quantity * p.price), 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="d-grid gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-lg rounded-pill shadow"
                                            onClick={addSupplier}
                                            disabled={loading || contactError}
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                border: 'none',
                                                color: 'white'
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    {isEditing ? 'Updating...' : 'Adding...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`fas ${isEditing ? 'fa-save' : 'fa-plus-circle'} me-2`}></i>
                                                    {isEditing ? 'Update Supplier' : 'Add Supplier'}
                                                </>
                                            )}
                                        </button>
                                        
                                        {isEditing && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-lg rounded-pill"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setSelectedSupplier(null);
                                                    setNewSupplier({
                                                        name: "",
                                                        contact: "",
                                                        address: "",
                                                        products: [],
                                                        billDate: new Date().toISOString().split('T')[0]
                                                    });
                                                    setContactError("");
                                                }}
                                            >
                                                <i className="fas fa-times me-2"></i>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Suppliers List */}
                    <div className="col-xl-8 col-lg-7">
                        <div className="card shadow-lg border-0 rounded-4 h-100">
                            <div className="card-header border-0 rounded-top-4" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                                <div className="row align-items-center">
                                    <div className="col-md-6">
                                        <h3 className="mb-0 text-white fw-bold">
                                            <i className="fas fa-users me-2"></i>
                                            Suppliers Directory
                                        </h3>
                                        <p className="mb-0 text-white-50">Total: {filteredSuppliers.length} suppliers</p>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="input-group">
                                            <span className="input-group-text border-0 bg-white">
                                                <i className="fas fa-search text-muted"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control border-0"
                                                placeholder="Search suppliers..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-4">
                                {/* Controls */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="d-flex gap-2">
                                            <button
                                                className={`btn btn-sm rounded-pill px-3 ${sortField === 'name' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => handleSort('name')}
                                            >
                                                <i className="fas fa-sort-alpha-down me-1"></i>
                                                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </button>
                                            <button
                                                className={`btn btn-sm rounded-pill px-3 ${sortField === 'date' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => handleSort('date')}
                                            >
                                                <i className="fas fa-calendar me-1"></i>
                                                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-md-6 text-end">
                                        <select
                                            className="form-select form-select-sm w-auto d-inline-block rounded-pill"
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        >
                                            <option value={3}>3 per page</option>
                                            <option value={6}>6 per page</option>
                                            <option value={12}>12 per page</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Suppliers Grid */}
                                {filteredSuppliers.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="mb-4">
                                            <i className="fas fa-users text-muted" style={{fontSize: '4rem'}}></i>
                                        </div>
                                        <h4 className="text-muted">No suppliers found</h4>
                                        <p className="text-muted">Add your first supplier or adjust your search criteria.</p>
                                    </div>
                                ) : (
                                    <div className="row g-4">
                                        {currentSuppliers.map((supplier) => {
                                            const totalValue = memoizedCalculateSupplierValue(supplier);
                                            const productCount = supplier.products ? supplier.products.length : 0;
                                            
                                            return (
                                                <div key={supplier.id} className="col-lg-6 col-xl-4">
                                                    <div className="card h-100 border-0 shadow-sm rounded-3 hover-card" style={{transition: 'all 0.3s ease'}}>
                                                        <div className="card-header border-0 rounded-top-3" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h5 className="mb-1 text-white fw-bold">{supplier.name}</h5>
                                                                    <small className="text-white-50">
                                                                        <i className="fas fa-calendar-alt me-1"></i>
                                                                        {new Date(supplier.billDate).toLocaleDateString('en-GB')}
                                                                    </small>
                                                                </div>
                                                                <div className="dropdown">
                                                                    <button className="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
                                                                        <i className="fas fa-ellipsis-v"></i>
                                                                    </button>
                                                                    <ul className="dropdown-menu shadow-sm">
                                                                        <li>
                                                                            <button className="dropdown-item" onClick={() => editSupplier(supplier)}>
                                                                                <i className="fas fa-edit me-2 text-primary"></i>
                                                                                Edit
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button className="dropdown-item text-danger" onClick={() => deleteSupplier(supplier.id)}>
                                                                                <i className="fas fa-trash me-2"></i>
                                                                                Delete
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="card-body p-3">
                                                            <div className="mb-3">
                                                                <div className="d-flex align-items-center mb-2">
                                                                    <i className="fas fa-phone text-primary me-2"></i>
                                                                    <span className="fw-medium">{supplier.contact}</span>
                                                                </div>
                                                                {supplier.address && (
                                                                    <div className="d-flex align-items-start">
                                                                        <i className="fas fa-map-marker-alt text-danger me-2 mt-1"></i>
                                                                        <small className="text-muted flex-grow-1">{supplier.address}</small>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="row g-2 mb-3">
                                                                <div className="col-6">
                                                                    <div className="text-center p-2 rounded-3" style={{backgroundColor: '#e3f2fd'}}>
                                                                        <div className="fw-bold text-primary">{productCount}</div>
                                                                        <small className="text-muted">Products</small>
                                                                    </div>
                                                                </div>
                                                                <div className="col-6">
                                                                    <div className="text-center p-2 rounded-3" style={{backgroundColor: '#e8f5e8'}}>
                                                                        <div className="fw-bold text-success">₹{totalValue.toFixed(0)}</div>
                                                                        <small className="text-muted">Total Value</small>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                className="btn btn-primary btn-sm w-100 rounded-pill"
                                                                onClick={() => fetchSupplierProducts(supplier)}
                                                                style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
                                                            >
                                                                <i className="fas fa-eye me-2"></i>
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="d-flex justify-content-center mt-4">
                                        <nav>
                                            <ul className="pagination pagination-sm">
                                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link rounded-start-pill" onClick={() => paginate(currentPage - 1)}>
                                                        <i className="fas fa-chevron-left"></i>
                                                    </button>
                                                </li>
                                                {Array.from({length: totalPages}, (_, i) => i + 1).map(number => (
                                                    <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => paginate(number)}>
                                                            {number}
                                                        </button>
                                                    </li>
                                                ))}
                                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                    <button className="page-link rounded-end-pill" onClick={() => paginate(currentPage + 1)}>
                                                        <i className="fas fa-chevron-right"></i>
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier Details Modal */}
                {selectedSupplier && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 rounded-top-4" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
                                    <div>
                                        <h4 className="modal-title text-white fw-bold mb-0">
                                            <i className="fas fa-building me-2"></i>
                                            {selectedSupplier.name}
                                        </h4>
                                        <p className="text-white-50 mb-0">
                                            <i className="fas fa-calendar-alt me-1"></i>
                                            Bill Date: {new Date(selectedSupplier.billDate).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setSelectedSupplier(null)}
                                    ></button>
                                </div>
                                
                                <div className="modal-body p-4">
                                    {/* Supplier Info */}
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                                                    <i className="fas fa-phone text-primary"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-medium">Contact</div>
                                                    <div className="text-muted">{selectedSupplier.contact}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedSupplier.address && (
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-start">
                                                    <div className="bg-danger bg-opacity-10 rounded-3 p-2 me-3">
                                                        <i className="fas fa-map-marker-alt text-danger"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-medium">Address</div>
                                                        <div className="text-muted small">{selectedSupplier.address}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Products Section */}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="fw-bold mb-0">
                                            <i className="fas fa-boxes me-2 text-primary"></i>
                                            Products
                                        </h5>
                                        {selectedSupplier.products && selectedSupplier.products.length > 0 && (
                                            <span className="badge bg-primary rounded-pill px-3 py-2">
                                                {selectedSupplier.products.length} items
                                            </span>
                                        )}
                                    </div>

                                    {loadingProducts ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary"></div>
                                            <p className="mt-2 text-muted">Loading products...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {selectedSupplier.products && selectedSupplier.products.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Product</th>
                                                                <th>Quantity</th>
                                                                <th>Price</th>
                                                                <th>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedSupplier.products.map((product, index) => {
                                                                const category = productCategories.find(c => c.id === product.category);
                                                                const total = product.quantity * product.price;
                                                                
                                                                return (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <div className="d-flex align-items-center">
                                                                                <span className="me-2">{category?.icon || "📦"}</span>
                                                                                <span className="fw-medium">{product.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <span className="badge bg-light text-dark">
                                                                                {product.quantity} {product.unit}
                                                                            </span>
                                                                        </td>
                                                                        <td>₹{product.price}</td>
                                                                        <td>
                                                                            <span className="fw-bold text-success">₹{total.toFixed(2)}</span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot className="table-light">
                                                            <tr>
                                                                <th colSpan="3" className="text-end">Grand Total:</th>
                                                                <th>
                                                                    <span className="fs-5 text-primary">
                                                                        ₹{memoizedCalculateSupplierValue(selectedSupplier).toFixed(2)}
                                                                    </span>
                                                                </th>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="fas fa-box-open text-muted mb-3" style={{fontSize: '3rem'}}></i>
                                                    <p className="text-muted">No products added yet</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                
                                <div className="modal-footer border-0">
                                    <button
                                        type="button"
                                        className="btn btn-secondary rounded-pill px-4"
                                        onClick={() => setSelectedSupplier(null)}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary rounded-pill px-4"
                                        onClick={() => {
                                            editSupplier(selectedSupplier);
                                            setSelectedSupplier(null);
                                        }}
                                        style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}
                                    >
                                        <i className="fas fa-edit me-2"></i>
                                        Edit Supplier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .hover-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
                }
                .max-height-200 {
                    max-height: 200px;
                }
                .page-link {
                    border: none;
                    color: #667eea;
                }
                .page-item.active .page-link {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                }
                .form-control:focus, .form-select:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }
            `}</style>
        </div>
    );
}
