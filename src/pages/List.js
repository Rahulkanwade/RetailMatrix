import React, { useState } from "react";
import { Container, Card, Form, ListGroup, Button, InputGroup, Row, Col, Badge } from "react-bootstrap";
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
}
;


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
    <div className="recipe-wrapper">
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 recipe-card">
              <Card.Header className="bg-warning text-dark text-center py-3">
                <h2 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  घटक यादी
                </h2>
                <Badge bg="light" text="dark" className="mt-2 fs-5 px-3 py-2 shadow-sm">
                  {quantity} किलो
                </Badge>
              </Card.Header>
              <Card.Body>
                {showSuccess && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    यादी व्हॉट्सअँपवर पाठवली आहे!
                    <button type="button" className="btn-close" onClick={() => setShowSuccess(false)}></button>
                  </div>
                )}
                <div className="product-selector mb-4">
                  <h5 className="text-muted mb-3">उत्पादन निवडा:</h5>
                  <div className="d-flex justify-content-between">
                    <Button
                      variant={selectedProduct === "रोट" ? "warning" : "outline-warning"}
                      onClick={() => setSelectedProduct("रोट")}
                    >
                      रोट
                    </Button>
                    <Button
                      variant={selectedProduct === "बिस्किट" ? "warning" : "outline-warning"}
                      onClick={() => setSelectedProduct("बिस्किट")}
                    >
                      बिस्किट
                    </Button>
                    <Button
                      variant={selectedProduct === "नानकटाई" ? "warning" : "outline-warning"}
                      onClick={() => setSelectedProduct("नानकटाई")}
                    >
                      नानकटाई
                    </Button>
                    <Button
                      variant={selectedProduct === "गव्हाचे बिस्किट" ? "warning" : "outline-warning"}
                      onClick={() => setSelectedProduct("गव्हाचे बिस्किट")}
                    >
                      गव्हाचे बिस्किट
                    </Button>
                  </div>
                </div>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">मात्रा निवडा:</Form.Label>
                  <div className="quantity-selector">
                    <Form.Range
                      min={2}
                      max={20}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="mb-2"
                    />
                    <div className="d-flex justify-content-between">
                      <span>2 किलो</span>
                      <span>20 किलो</span>
                    </div>
                  </div>
                </Form.Group>

                <div className="ingredient-list mb-4">
                  <h5 className="text-muted mb-3">सामग्री:</h5>
                  <ListGroup variant="flush" className="shadow-sm border">
                    {Object.entries(allPresets[selectedProduct][quantity] || {}).map(([item, amount]) => (
                      <ListGroup.Item key={item} className="d-flex justify-content-between align-items-center py-3">
                        <div>
                          <span className="ingredient-icon me-2">{ingredientIcons[item] || "🧂"}</span>
                          <span className="fw-bold">{item}</span>
                        </div>
                        <Badge bg="warning" text="dark" pill className="px-3 py-2 fs-6">
                          {amount < 1 ? (amount * 1000).toFixed(2) + " ग्रॅम" : amount.toFixed(2) + " किलो"}
                        </Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>

                <div className="whatsapp-section mt-4">
                  <h5 className="text-muted mb-3">व्हॉट्सअँप द्वारे यादी पाठवा:</h5>
                  <InputGroup className="mb-3">
                    <InputGroup.Text className="bg-white">
                      <i className="bi bi-phone"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="tel"
                      placeholder="मोबाईल नंबर टाका"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </InputGroup>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 py-2"
                    onClick={sendMessage}
                    disabled={!mobile}
                  >
                    <i className="bi bi-whatsapp me-2"></i>
                    व्हॉट्सअँपवर पाठवा
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <style>
        {`
          .recipe-wrapper {
            background-color: #f8f9fa;
            min-height: 100vh;
            padding: 20px 0;
          }
          
          .recipe-card {
            border-radius: 15px;
            overflow: hidden;
          }
          
          .ingredient-list {
            background-color: #fff;
            border-radius: 10px;
          }
          
          .ingredient-icon {
            font-size: 1.2rem;
          }
          
          .quantity-selector {
            background-color: #fff;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #dee2e6;
          }
          
          /* Add Bootstrap Icons */
          @import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css");
        `}
      </style>
    </div>
  );
};

export default List;