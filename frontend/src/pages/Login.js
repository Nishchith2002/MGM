

import React, { useState } from "react";
import axios from "axios";
import Background from "../components/Background";
import bgImage from "../assets/HSBC_Img.JPEG";
import { Form, Button, Alert, Card } from "react-bootstrap";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { getUserRole } from "../config/userRoles"; // Import user roles

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      console.log(process.env.REACT_APP_BE_URL);
     const response = await axios.post(
      
  `${process.env.REACT_APP_BE_URL}/api/skyspark-login`,  // This should be: ${process.env.REACT_APP_BE_URL}/api/skyspark-login
  { username, password },
  { withCredentials: true }
);



      if (response.status === 200) {
        Swal.fire("Success", "Login Successful!", "success");

        // Step 1: Get user role and permissions
        const userRole = getUserRole(username);

        // Step 2: Save user info to localStorage
        localStorage.setItem("user", JSON.stringify({ 
          username,
          role: userRole.role,
          assignedSite: userRole.site,
          allowedPages: userRole.allowedPages,
          lockSite: userRole.lockSite
        }));

        // Step 3: Set the site to user's assigned site
        if (userRole.site) {
          localStorage.setItem("selectedSite", userRole.site);
        }

        // Step 4: Redirect to first allowed page (FIXED)
        setTimeout(() => {
          const firstAllowedPage = userRole.allowedPages && userRole.allowedPages.length > 0 
            ? userRole.allowedPages[0] 
            : "/Home";
          window.location.href = firstAllowedPage;
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials!");
      Swal.fire("Login Failed", "Invalid credentials!", "error");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          width: "900px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "14%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>MGM</h1>
          <h2 style={{ fontSize: "1.5rem", color: " #0056A8", margin: "10px 0" }}>
            MGM
          </h2>
          <p style={{ fontSize: "1rem", marginBottom: "30px" }}>
            Login to explore NV5 Enalytics at MGM
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "60%",
            left: "15%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "rgba(255, 255, 255, 0)",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "white" }}>
            Login
          </h3>
          <Form onSubmit={handleLogin}>
            <Form.Group controlId="formUsername">
              <Form.Label style={{ color: "white" }}>username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="formPassword" className="mt-2">
              <Form.Label style={{ color: "white" }}>password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="mt-3 w-100"
              style={{ fontWeight: "bold" }}
            >
              Log In
            </Button>
          </Form>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </div>
      </div>
    </div>
  );
};

export default Login;


