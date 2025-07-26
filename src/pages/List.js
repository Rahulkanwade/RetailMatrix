import React, { useState } from "react";
import { Container, Card, Form, ListGroup, Button, InputGroup, Row, Col, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const List = () => {
  const ingredientPresets = {
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
  };

  const [quantity, setQuantity] = useState(2);
  const [mobile, setMobile] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const sendMessage = () => {
    const ingredients = Object.entries(ingredientPresets[quantity] || {})
      .map(([item, amount]) => `${item}: ${amount < 1 ? (amount * 1000).toFixed(2) + " ग्रॅम" : amount.toFixed(2) + " किलो"}`)
      .join("\n");

    const message = `रोट घटक यादी (${quantity} किलो):\n${ingredients}`;
    const encodedMessage = encodeURIComponent(message);

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/${mobile}?text=${encodedMessage}`, "_blank");
  };

  const ingredientIcons = {
    "रवा": "🌾", // Semolina
    "मैदा": "🍚", // Flour
    "साखर": "🍯", // Sugar
    "एलायची पावडर": "🌿", // Cardamom
    "तुप": "🧈", // Ghee
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
                  रोट घटक यादी
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
                    {Object.entries(ingredientPresets[quantity] || {}).map(([item, amount]) => (
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