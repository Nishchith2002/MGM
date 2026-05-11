import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Home = () => {
  return (
    <Container fluid className="px-4 py-3">
      {/* First Row: Electricity Reduction & Enalytics Savings (Side by Side on Large Screens) */}
      <Row className="mb-3">
        <Col lg={6} md={12}></Col>
        <Col lg={6} md={12}></Col>
      </Row>

      {/* Second Row: Monthly Utility Graph & Savings Graph */}
      <Row className="mb-3">
        <Col lg={6} md={12} className="d-flex flex-column"></Col>
        <Col lg={6} md={12} className="d-flex flex-column"></Col>
      </Row>

      {/* ✅ Third Row: Total Energy Graph (Prevents Overlap) */}
      <Row className="mb-3">
        <Col lg={6} md={12} className="d-flex flex-column"></Col>
      </Row>

      <Row className="mb-3">
        <Col lg={6} md={12} className="d-flex flex-column"></Col>
        <Col lg={6} md={12} className="d-flex flex-column"></Col>
      </Row>
    </Container>
  );
};

export default Home;
