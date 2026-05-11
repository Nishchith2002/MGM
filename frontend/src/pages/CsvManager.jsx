import React from "react";
import CsvBox from "../components/CsvBox";
import { Container, Row, Col } from "react-bootstrap";

export default function CsvManager() {
  return (
    <Container fluid style={{ marginTop: "100px", marginLeft: "90px", marginRight: "40px" }}>
      {/* ===== Macau Section ===== */}
      <h3 style={{ color: "darkred" }}>Macau</h3>
      <Row style={{ borderBottom: "2px dotted orangered", marginBottom: "20px" }}>
        <Col md={6}>
          <h5>Consumption</h5>
          <CsvBox label="Consumption" fileName="Macau_Consumption.csv" />
          <h5>Cost</h5>
          <CsvBox label="Cost" fileName="Macau_Cost_Corrected.csv" />
          <h5>Consumption Profile (Elec)</h5>
          <CsvBox label="Consumption Profile (Elec)" fileName="Macho_Cleaned_Consumption.csv" />
        </Col>

        <Col md={6}>
          <h5>Consumption Profile (Water)</h5>
          <CsvBox label="Consumption Profile (Water)" fileName="Macau_Water_Breakdown.csv" />
          <h5>Consumption Profile (Energy)</h5>
          <CsvBox label="Consumption Profile (Energy)" fileName="Macau_Energy_Breakdown.csv" />
          <h5>Consumption Profile (LPG)</h5>
          <CsvBox label="Consumption Profile (LPG)" fileName="Macau_Gas_Breakdown.csv" />
          <h5>Room Occupancy (BOTH SITES)</h5>
          <CsvBox label="Room Occupancy" fileName="corrected_room_occupancy.csv" />
        </Col>
      </Row>

      {/* ===== Cotai Section ===== */}
      <h3 style={{ color: "darkorange" }}>Cotai</h3>
      <Row style={{ borderBottom: "2px dotted orangered", marginBottom: "20px" }}>
        <Col md={6}>
          <h5>Consumption</h5>
          <CsvBox label="Consumption" fileName="Cotai_Consumption.csv" />
          <h5>Cost</h5>
          <CsvBox label="Cost" fileName="Cotai_Cost_Corrected.csv" />
          <h5>Consumption Profile (Elec)</h5>
          <CsvBox label="Consumption Profile (Elec)" fileName="Cotai_Cleaned_Consumption.csv" />
        </Col>

        <Col md={6}>
          <h5>Consumption Profile (Water)</h5>
          <CsvBox label="Consumption Profile (Water)" fileName="Cotai_Water_Breakdown.csv" />
          <h5>Consumption Profile (Energy)</h5>
          <CsvBox label="Consumption Profile (Energy)" fileName="Cotai_Energy_Breakdown.csv" />
          <h5>Consumption Profile (NG)</h5>
          <CsvBox label="Consumption Profile (NG)" fileName="Cotai_Gas_Breakdown.csv" />
        </Col>
      </Row>
    </Container>
  );
}
