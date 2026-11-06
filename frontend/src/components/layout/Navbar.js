// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Grid,
  IconButton,
  Button,
} from '@mui/material';

import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../assets/mgm.png';
import Door from "../../assets/door_black.png"
import Log from "../../assets/userLogo.png";
import { Form } from 'react-bootstrap';


const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSite, setSelectedSite] = useState(localStorage.getItem("selectedSite") || "Cotai");

  // Parse user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // If user has assigned site, lock to it
      if (userData.assignedSite) {
        setSelectedSite(userData.assignedSite);
        localStorage.setItem("selectedSite", userData.assignedSite);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedSite = localStorage.getItem("selectedSite") || "Cotai";
      setSelectedSite(storedSite);
    };

    window.addEventListener("siteChange", handleStorageChange);
    return () => window.removeEventListener("siteChange", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("selectedSite");
    localStorage.removeItem("activePath");
    navigate("/login");
  };

  const pageTitles = {
    '/Home': 'Executive Summary',
    '/Utility': 'Utility',
    '/CarbonEmissionsDashboard': 'Carbon Emission',
    '/HeatMap': 'HeatMap',
    '/WineCellur': 'WineCellur',
    '/plant': ' Plant Performance',
    '/Skyspark': 'Analytics Engine',
    '/gas': 'Utility',
    '/water': 'Utility',
    '/energy': 'Utility',
    '/utility': 'Utility',
    '/LibraryPage': 'Library',
    '/SensorMonitoring': 'SensorMonitoring',
    '/mgm': 'Sun Path',
    '/MFMCustomer' : 'MGM Customer Comfort',
    "/iaq":'INDOOR AIR QUALITY',
   
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #ddd',
          zIndex: 1000,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
          {/* Left: Logo + Page Title */}
          <Grid
            container
            alignItems="center"
            spacing={2}
            sx={{ width: 'auto' }}
          >
            <Grid item>
              <img
                src={Logo}
                alt="Logo"
                style={{ width: '100px', height: 'auto', marginLeft: '60px' }}
              />
            </Grid>
            <Grid item>
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', color: '#f37021' }}
              >
                MGM China Holdings
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#f37021' }}
              >
                {pageTitles[location.pathname] || 'HeatMap'}
              </Typography>
            </Grid>
          </Grid>

          {/* Right: Site Selector, Date, Username, Logout */}
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ width: 'auto' }}
          >
            {/* Site Selector - LOCKED for restricted users, UNLOCKED for full access users */}
            {user && user.lockSite ? (
              // Locked - Show as disabled text or badge
              <Grid item>
                <Box sx={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  minWidth: '120px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {selectedSite}
                </Box>
              </Grid>
            ) : (
              // Unlocked - Show as dropdown
              <Grid item>
                <Form.Select
                  value={selectedSite}
                  onChange={(e) => {
                    const newSite = e.target.value;
                    localStorage.setItem("selectedSite", newSite);
                    setSelectedSite(newSite);
                    window.dispatchEvent(new Event("siteChange"));
                  }}
                  style={{ minWidth: '120px' }}
                >
                  <option value="Cotai">Cotai</option>
                  <option value="Macho">Macau</option>
                  <option value="All">All Sites</option>
                </Form.Select>
              </Grid>
            )}

            {/* Date */}
            <Grid item>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  <Typography variant="body2" style={{ color: "black" }}>
                    {new Date().toISOString().split('T')[0]}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Username */}
            <Grid item>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  <Typography variant="body2" style={{ color: "black" }}>
                    <img 
                      src={Log} 
                      alt="User Icon" 
                      style={{ width: "18px", height: "auto", marginRight: "5px" }} 
                    />
                    {user ? user.username : 'Guest'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Logout */}
            <Grid item>
              <img 
                src={Door} 
                alt="Logout" 
                style={{ width: "25px", height: "auto", cursor: "pointer" }} 
                onClick={handleLogout}
                title="Logout"
              />
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      {/* Spacing for home page graphs */}
      {location.pathname === '/Home' && (
        <Box sx={{ mt: 16 }}></Box>
      )}
    </>
  );
};

export default Header;

