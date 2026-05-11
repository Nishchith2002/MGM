


// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Box, IconButton, useMediaQuery, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

// Icons
import Home from '../../assets/home.png';
import Analytics from '../../assets/Enalytics.png';
import ArrowIcon from '../../assets/arrow1.png';
import UtilityIcon from '../../assets/utility.png';
import Co2 from '../../assets/carbon_white.png';
import HeatMapIcon from '../../assets/heatmap2.png';
import WineCellur from '../../assets/R.png';
import Skyspark from '../../assets/skysparkIcon.png';
import Folder from '../../assets/folder3.png';
import Performace from '../../assets/search4.png';
import Alarm from '../../assets/alarm1.png';
import SunPath from '../../assets/solar2_white.png';
import Customer from "../../assets/customerReview1.png"

import { getSidebarItemsForUser } from '../../config/userRoles';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(localStorage.getItem("activePath") || "/Home");
  const [allowedMenuItems, setAllowedMenuItems] = useState([]);
  const isMobile = useMediaQuery("(max-width: 600px)");

  // Load user & allowed items
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.username) {
        const filteredItems = getSidebarItemsForUser(parsedUser.username);
        setAllowedMenuItems(filteredItems);
      }
    }
  }, []);

  // Track active menu selection
  useEffect(() => {
    setActiveItem(location.pathname);
    localStorage.setItem("activePath", location.pathname);
  }, [location.pathname]);

  // All possible menu items
  const allMenuItems = [
    { icon: Home, alt: "Home", path: "/Home" },
    { icon: UtilityIcon, alt: "Utility", path: "/Utility" },
    { icon: Co2, alt: "Co2", path: "/CarbonEmissionsDashboard" },
    { icon: HeatMapIcon, alt: "Heatmap", path: "/HeatMap" },
    { icon: SunPath, alt: "Sun Path", path: "/mgm" },   // ✔ SunPath
    { icon: Performace, alt: "Plant", path: "/plant" },
    { icon: Folder, alt: "Folder", path: "/LibraryPage" },
    { icon: Alarm, alt: "Alarm", path: "/SensorMonitoring" },
    { icon: WineCellur, alt: "WineCellur", path: "/WineCellur" },
    { icon: Customer, alt: "customer", path: "/MFMCustomer" },
    { icon: Skyspark, alt: "Skyspark", path: "/Skyspark" },
  ];

  // Final visible menu based on roles
  const menuItems = allowedMenuItems.length > 0
    ? allMenuItems.filter(item =>
        allowedMenuItems.some(allowed => allowed.path === item.path)
      )
    : allMenuItems;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: isMobile ? "60px" : "80px",
        backgroundColor: "#d4a217",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        pt: 2,
        boxShadow: 3,
        zIndex: 1200,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {menuItems.map((item, index) => (
          <Box key={index} sx={{ position: "relative", width: "100%", textAlign: "center" }}>
            <Tooltip title={item.alt} placement="right" arrow>
              <IconButton
  onClick={() => {
    if (item.alt === "Skyspark") {
      window.location.href = `${process.env.REACT_APP_SKY_HOST}/ui/mgmCotaiLora/`;
    } else {
      navigate(item.path);
    }
  }}
  sx={{
    width: "100%",
    height: "60px",
    borderRadius: 0,
    backgroundColor: "transparent",

    "&:hover": {
      backgroundColor: "transparent",
    },

    "&:focus": {
      backgroundColor: "transparent",
    },

    "&.Mui-focusVisible": {
      backgroundColor: "transparent",
    },
  }}
>
                <img src={item.icon} alt={item.alt} style={{ width: "50px", height: "50px" }} />
              </IconButton>
            </Tooltip>

            {activeItem === item.path && item.alt !== "Skyspark" && (
              <img
                src={ArrowIcon}
                alt="Arrow"
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "19px",
                  transform: "translateY(-50%)",
                  width: "100px",
                  height: "90px",
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Tooltip title="Analytics" placement="right" arrow>
          <IconButton onClick={() => navigate("/Analytics")}>
            <img src={Analytics} alt="Analytics" style={{ width: "40px", height: "40px" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Sidebar;
