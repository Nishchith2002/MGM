// src/components/MFMCustomer.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import MGMFloorPlanIntegrated from '../components/MFMCustomer';   // your existing Macau component
import MGMCotaiFloorPlan      from '../components/MGMCotaiFloorPlan';   // new Cotai component

const MFMCustomer = () => {
  const [selectedSite, setSelectedSite] = useState(
    localStorage.getItem('selectedSite') || 'Cotai'
  );

  // Listen for site changes dispatched by the Header
  useEffect(() => {
    const handler = () => {
      setSelectedSite(localStorage.getItem('selectedSite') || 'Cotai');
    };
    window.addEventListener('siteChange', handler);
    return () => window.removeEventListener('siteChange', handler);
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* ── Site label badge (top-centre) ── */}
      <Box sx={{
        position: 'fixed',
        top: 70,            // just below the AppBar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        backgroundColor: 'rgba(200,168,0,0.92)',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.78rem',
        px: 2.5, py: 0.5,
        borderRadius: '0 0 10px 10px',
        letterSpacing: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
      }}>
        MGM {selectedSite === 'Macho' ? 'MACAU' : selectedSite.toUpperCase()} — L1 Gaming Floor
      </Box>

      {/* ── Render the correct floor plan ── */}
      {(selectedSite === 'Macho' || selectedSite === 'Macau') ? (
        <MGMFloorPlanIntegrated />
      ) : (
        <MGMCotaiFloorPlan />
      )}
    </Box>
  );
};

export default MFMCustomer;