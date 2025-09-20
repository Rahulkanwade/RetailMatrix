import React, { useState } from "react";
import { Container, Card, Form, Row, Col, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const List = () => {
  const allPresets = {
    "रोट": {
      2: { "रवा": 1.50, "मैदा": 0.50, "साखर": 1, "एलायची पावडर": 0.01, "तुप": 0.5 },
      3: { "रवा": 2.50, "मैदा": 0.50, "साखर": 1.5, "एलायची पावडर": 0.01, "तुप": 1 },
      4: { "रवा": 3, "मैदा": 1, "साखर": 2, "एलायची पावडर": 0.01, "तुप": 1 },
      5: { "रवा": 4, "मैदा": 1, "साखर": 2.5, "एलायची पावडर": 0.01, "तुप": 1.5 },
      6: { "रवा": 5, "मैदा": 1, "साखर": 3, "एलायची पावडर": 0.01, "तुप": 1.5 },
      7: { "रवा": 6, "मैदा": 1, "साखर": 3.5, "एलायची पावडर": 0.01, "तुप": 2 },
      8: { "रवा": 6.5, "मैदा": 1.5, "साखर": 4, "एलायची पावडर": 0.01, "तुप": 2 },
      9: { "रवा": 7, "मैदा": 2, "साखर": 4.5, "एलायची पावडर": 0.01, "तुप": 2.5 },
      10: { "रवा": 8, "मैदा": 2, "साखर": 5, "एलायची पावडर": 0.02, "तुप": 3 },
      11: { "रवा": 9, "मैदा": 2, "साखर": 5, "एलायची पावडर": 0.02, "तुप": 3 },
      12: { "रवा": 10, "मैदा": 2, "साखर": 5, "एलायची पावडर": 0.02, "तुप": 3 },
      13: { "रवा": 11, "मैदा": 2, "साखर": 10, "एलायची पावडर": 0.02, "तुप": 5 },
      14: { "रवा": 12, "मैदा": 2, "साखर": 10, "एलायची पावडर": 0.02, "तुप": 5 },
      15: { "रवा": 12, "मैदा": 3, "साखर": 10, "एलायची पावडर": 0.02, "तुप": 5 },
      16: { "रवा": 14, "मैदा": 3, "साखर": 10, "एलायची पावडर": 0.03, "तुप": 5 },
      17: { "रवा": 13, "मैदा": 3, "साखर": 10, "एलायची पावडर": 0.03, "तुप": 5 },
      18: { "रवा": 15, "मैदा": 3, "साखर": 10, "एलायची पावडर": 0.03, "तुप": 5 },
      19: { "रवा": 15, "मैदा": 3, "साखर": 10, "एलायची पावडर": 0.03, "तुप": 5 },
      20: { "रवा": 16, "मैदा": 4, "साखर": 10, "एलायची पावडर": 0.03, "तुप": 5 },
    },
  
    "बिस्किट": {
      2:  { "मैदा": 2,  "साखर": 1,   "तुप": 1,   "दूध": 1 },
      3:  { "मैदा": 3,  "साखर": 1.5, "तुप": 1.5, "दूध": 1.5 },
      4:  { "मैदा": 4,  "साखर": 2,   "तुप": 2,   "दूध": 2 },
      5:  { "मैदा": 5,  "साखर": 2.5, "तुप": 2.5, "दूध": 2.5 },
      6:  { "मैदा": 6,  "साखर": 3,   "तुप": 3,   "दूध": 3 },
      7:  { "मैदा": 7,  "साखर": 3.5, "तुप": 3.5, "दूध": 3.5 },
      8:  { "मैदा": 8,  "साखर": 4,   "तुप": 4,   "दूध": 4 },
      9:  { "मैदा": 9,  "साखर": 4.5, "तुप": 4.5, "दूध": 4.5 },
      10: { "मैदा": 10, "साखर": 5,   "तुप": 5,   "दूध": 5 },
      11: { "मैदा": 11, "साखर": 5.5, "तुप": 5.5, "दूध": 5.5 },
      12: { "मैदा": 12, "साखर": 6,   "तुप": 6,   "दूध": 6 },
      13: { "मैदा": 13, "साखर": 6.5, "तुप": 6.5, "दूध": 6.5 },
      14: { "मैदा": 14, "साखर": 7,   "तुप": 7,   "दूध": 7 },
      15: { "मैदा": 15, "साखर": 7.5, "तुप": 7.5, "दूध": 7.5 },
      16: { "मैदा": 16, "साखर": 8,   "तुप": 8,   "दूध": 8 },
      17: { "मैदा": 17, "साखर": 8.5, "तुप": 8.5, "दूध": 8.5 },
      18: { "मैदा": 18, "साखर": 9,   "तुप": 9,   "दूध": 9 },
      19: { "मैदा": 19, "साखर": 9.5, "तुप": 9.5, "दूध": 9.5 },
      20: { "मैदा": 20, "साखर": 10,  "तुप": 10,  "दूध": 10 }
    },

    "नानकटाई": {
      2:  { "मैदा": 2,  "पीठी साखर": 1,   "तुप": 1,   "दूध": 1 },
      3:  { "मैदा": 3,  "पीठी साखर": 1.5, "तुप": 1.5, "दूध": 1.5 },
      4:  { "मैदा": 4,  "पीठी साखर": 2,   "तुप": 2,   "दूध": 2 },
      5:  { "मैदा": 5,  "पीठी साखर": 2.5, "तुप": 2.5, "दूध": 2.5 },
      6:  { "मैदा": 6,  "पीठी साखर": 3,   "तुप": 3,   "दूध": 3 },
      7:  { "मैदा": 7,  "पीठी साखर": 3.5, "तुप": 3.5, "दूध": 3.5 },
      8:  { "मैदा": 8,  "पीठी साखर": 4,   "तुप": 4,   "दूध": 4 },
      9:  { "मैदा": 9,  "पीठी साखर": 4.5, "तुप": 4.5, "दूध": 4.5 },
      10: { "मैदा": 10, "पीठी साखर": 5,   "तुप": 5,   "दूध": 5 },
      11: { "मैदा": 11, "पीठी साखर": 5.5, "तुप": 5.5, "दूध": 5.5 },
      12: { "मैदा": 12, "पीठी साखर": 6,   "तुप": 6,   "दूध": 6 },
      13: { "मैदा": 13, "पीठी साखर": 6.5, "तुप": 6.5, "दूध": 6.5 },
      14: { "मैदा": 14, "पीठी साखर": 7,   "तुप": 7,   "दूध": 7 },
      15: { "मैदा": 15, "पीठी साखर": 7.5, "तुप": 7.5, "दूध": 7.5 },
      16: { "मैदा": 16, "पीठी साखर": 8,   "तुप": 8,   "दूध": 8 },
      17: { "मैदा": 17, "पीठी साखर": 8.5, "तुप": 8.5, "दूध": 8.5 },
      18: { "मैदा": 18, "पीठी साखर": 9,   "तुप": 9,   "दूध": 9 },
      19: { "मैदा": 19, "पीठी साखर": 9.5, "तुप": 9.5, "दूध": 9.5 },
      20: { "मैदा": 20, "पीठी साखर": 10,  "तुप": 10,  "दूध": 10 }
    },

    "गव्हाचे बिस्किट": {
      2:  { "गव्हाचे पीठ": 2,  "पीठी साखर": 1,   "तुप": 1,   "दूध": 1 },
      3:  { "गव्हाचे पीठ": 3,  "पीठी साखर": 1.5, "तुप": 1.5, "दूध": 1.5 },
      4:  { "गव्हाचे पीठ": 4,  "पीठी साखर": 2,   "तुप": 2,   "दूध": 2 },
      5:  { "गव्हाचे पीठ": 5,  "पीठी साखर": 2.5, "तुप": 2.5, "दूध": 2.5 },
      6:  { "गव्हाचे पीठ": 6,  "पीठी साखर": 3,   "तुप": 3,   "दूध": 3 },
      7:  { "गव्हाचे पीठ": 7,  "पीठी साखर": 3.5, "तुप": 3.5, "दूध": 3.5 },
      8:  { "गव्हाचे पीठ": 8,  "पीठी साखर": 4,   "तुप": 4,   "दूध": 4 },
      9:  { "गव्हाचे पीठ": 9,  "पीठी साखर": 4.5, "तुप": 4.5, "दूध": 4.5 },
      10: { "गव्हाचे पीठ": 10, "पीठी साखर": 5,   "तुप": 5,   "दूध": 5 },
      11: { "गव्हाचे पीठ": 11, "पीठी साखर": 5.5, "तुप": 5.5, "दूध": 5.5 },
      12: { "गव्हाचे पीठ": 12, "पीठी साखर": 6,   "तुप": 6,   "दूध": 6 },
      13: { "गव्हाचे पीठ": 13, "पीठी साखर": 6.5, "तुप": 6.5, "दूध": 6.5 },
      14: { "गव्हाचे पीठ": 14, "पीठी साखर": 7,   "तुप": 7,   "दूध": 7 },
      15: { "गव्हाचे पीठ": 15, "पीठी साखर": 7.5, "तुप": 7.5, "दूध": 7.5 },
      16: { "गव्हाचे पीठ": 16, "पीठी साखर": 8,   "तुप": 8,   "दूध": 8 },
      17: { "गव्हाचे पीठ": 17, "पीठी साखर": 8.5, "तुप": 8.5, "दूध": 8.5 },
      18: { "गव्हाचे पीठ": 18, "पीठी साखर": 9,   "तुप": 9,   "दूध": 9 },
      19: { "गव्हाचे पीठ": 19, "पीठी साखर": 9.5, "तुप": 9.5, "दूध": 9.5 },
      20: { "गव्हाचे पीठ": 20, "पीठी साखर": 10,  "तुप": 10,  "दूध": 10 }
    }
  };

  const ingredientIcons = {
    "रवा": "🌾", "मैदा": "🍚", "साखर": "🍯", "एलायची पावडर": "🌿", "तुप": "🧈",
    "लोणी": "🧈", "बेकिंग पावडर": "🥄", "बेसन": "🥣"
  };

  const [quantity, setQuantity] = useState(2);
  const [mobile, setMobile] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("रोट");

  const sendMessage = () => {
    const ingredients = Object.entries(allPresets[selectedProduct][quantity] || {})
      .map(([item, amount]) => `${item}: ${amount < 1 ? (amount * 1000).toFixed(2) + " ग्रॅम" : amount.toFixed(2) + " किलो"}`)
      .join("\n");

    const message = `${selectedProduct} घटक यादी (${quantity} किलो):\n${ingredients}`;
    const encodedMessage = encodeURIComponent(message);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    window.open(`https://wa.me/${mobile}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="app-wrapper">
      <Container fluid className="px-4 py-5">
        <Row className="justify-content-center">
          <Col xl={8} lg={10}>
            {/* Header Section */}
            <div className="header-section mb-5">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h1 className="page-title mb-2">घटक यादी व्यवस्थापन</h1>
                  <p className="page-subtitle mb-0">व्यावसायिक उत्पादनासाठी सामग्री गणना आणि व्यवस्थापन</p>
                </div>
                <div className="quantity-display">
                  <div className="quantity-badge">
                    <span className="quantity-label">निवडलेली मात्रा</span>
                    <span className="quantity-value">{quantity} किलो</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <Row className="g-4">
              {/* Left Column - Controls */}
              <Col lg={4}>
                <Card className="control-card h-100">
                  <Card.Body className="p-4">
                    {showSuccess && (
                      <div className="success-alert mb-4">
                        <div className="success-icon">✓</div>
                        <div className="success-text">
                          <strong>यशस्वी!</strong>
                          <br />यादी व्हॉट्सअँपवर पाठवली आहे
                        </div>
                      </div>
                    )}

                    {/* Product Selection */}
                    <div className="control-section mb-4">
                      <h5 className="section-title mb-3">उत्पादन प्रकार</h5>
                      <div className="product-grid">
                        {Object.keys(allPresets).map((product) => (
                          <button
                            key={product}
                            className={`product-btn ${selectedProduct === product ? 'active' : ''}`}
                            onClick={() => setSelectedProduct(product)}
                          >
                            <span className="product-name">{product}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity Control */}
                    <div className="control-section mb-4">
                      <h5 className="section-title mb-3">मात्रा नियंत्रण</h5>
                      <div className="quantity-control">
                        <div className="range-container">
                          <Form.Range
                            min={2}
                            max={20}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="custom-range"
                          />
                          <div className="range-labels">
                            <span>2 किलो</span>
                            <span>20 किलो</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Section */}
                    <div className="control-section">
                      <h5 className="section-title mb-3">व्हॉट्सअँप पाठवा</h5>
                      <div className="whatsapp-section">
                        <div className="input-wrapper mb-3">
                          <input
                            type="tel"
                            placeholder="मोबाईल नंबर"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="mobile-input"
                          />
                        </div>
                        <button
                          className="whatsapp-btn"
                          onClick={sendMessage}
                          disabled={!mobile}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                          </svg>
                          यादी पाठवा
                        </button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Right Column - Ingredients List */}
              <Col lg={8}>
                <Card className="ingredients-card">
                  <Card.Header className="ingredients-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h4 className="ingredients-title mb-1">{selectedProduct} - सामग्री यादी</h4>
                        <p className="ingredients-subtitle mb-0">{quantity} किलो उत्पादनासाठी आवश्यक सामग्री</p>
                      </div>
                      <Badge className="ingredients-count">
                        {Object.keys(allPresets[selectedProduct][quantity] || {}).length} घटक
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="ingredients-list">
                      {Object.entries(allPresets[selectedProduct][quantity] || {}).map(([item, amount], index) => (
                        <div key={item} className="ingredient-item">
                          <div className="ingredient-info">
                            <div className="ingredient-icon-wrapper">
                              <span className="ingredient-icon">{ingredientIcons[item] || "🧂"}</span>
                            </div>
                            <div className="ingredient-details">
                              <h6 className="ingredient-name">{item}</h6>
                              <span className="ingredient-index">घटक #{index + 1}</span>
                            </div>
                          </div>
                          <div className="ingredient-amount">
                            <span className="amount-value">
                              {amount < 1 ? (amount * 1000).toFixed(2) : amount.toFixed(2)}
                            </span>
                            <span className="amount-unit">
                              {amount < 1 ? "ग्रॅम" : "किलो"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .app-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
        }

        .app-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 70%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .header-section {
          position: relative;
          z-index: 2;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .page-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 400;
        }

        .quantity-display {
          position: relative;
        }

        .quantity-badge {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .quantity-label {
          display: block;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .quantity-value {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
        }

        .control-card {
          background: #ffffff;
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 2;
        }

        .ingredients-card {
          background: #ffffff;
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 2;
          overflow: hidden;
        }

        .control-section {
          border-bottom: 1px solid #f1f3f4;
          padding-bottom: 1.5rem;
        }

        .control-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
          letter-spacing: -0.025em;
        }

        .product-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .product-btn {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
        }

        .product-btn:hover {
          border-color: #667eea;
          background: #f7faff;
          transform: translateY(-1px);
        }

        .product-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .product-name {
          font-size: 0.9rem;
          text-align: center;
          line-height: 1.3;
        }

        .quantity-control {
          background: #f8fafc;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .range-container {
          position: relative;
        }

        .custom-range {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          outline: none;
          margin-bottom: 1rem
      }

        .custom-range::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transition: all 0.2s ease;
        }

        .custom-range::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .custom-range::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .whatsapp-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .input-wrapper {
          position: relative;
        }

        .mobile-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          background: #ffffff;
          transition: all 0.2s ease;
          outline: none;
        }

        .mobile-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .whatsapp-btn {
          width: 100%;
          background: linear-gradient(135deg, #25d366, #128c7e);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }

        .whatsapp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
        }

        .whatsapp-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          box-shadow: none;
        }

        .success-alert {
          background: linear-gradient(135deg, #48bb78, #38a169);
          color: #ffffff;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideInUp 0.5s ease;
        }

        .success-icon {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .success-text {
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .ingredients-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #ffffff;
          border: none;
          padding: 1.5rem;
        }

        .ingredients-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .ingredients-subtitle {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .ingredients-count {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .ingredients-list {
          max-height: 600px;
          overflow-y: auto;
        }

        .ingredient-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f3f4;
          transition: all 0.2s ease;
        }

        .ingredient-item:hover {
          background: #f8fafc;
        }

        .ingredient-item:last-child {
          border-bottom: none;
        }

        .ingredient-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ingredient-icon-wrapper {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ingredient-icon {
          font-size: 1.5rem;
          filter: brightness(1.2);
        }

        .ingredient-details {
          display: flex;
          flex-direction: column;
        }

        .ingredient-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
          line-height: 1.3;
        }

        .ingredient-index {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .ingredient-amount {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
        }

        .amount-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.2;
        }

        .amount-unit {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive Design */
        @media (max-width: 991.98px) {
          .page-title {
            font-size: 2rem;
          }
          
          .quantity-badge {
            padding: 0.75rem 1rem;
          }
          
          .quantity-value {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 767.98px) {
          .page-title {
            font-size: 1.75rem;
          }
          
          .page-subtitle {
            font-size: 1rem;
          }
          
          .product-grid {
            grid-template-columns: 1fr;
          }
          
          .ingredient-item {
            padding: 1rem;
          }
          
          .ingredient-name {
            font-size: 0.9rem;
          }
          
          .amount-value {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default List;