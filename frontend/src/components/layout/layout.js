import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // To render dynamic pages
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Navbar';

const Layout = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Make the fullscreen toggle function available globally
  useEffect(() => {
    window.toggleLayoutFullscreen = (fullscreen) => {
      setIsFullscreen(fullscreen);
    };

    // Cleanup on unmount
    return () => {
      delete window.toggleLayoutFullscreen;
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar - Hide when fullscreen */}
      {!isFullscreen && <Sidebar />}

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Header - Hide when fullscreen */}
        {!isFullscreen && <Header />}
        
        {/* Dynamic content with conditional styling */}
        <div style={{
          height: isFullscreen ? '100vh' : 'calc(100vh - [HEADER_HEIGHT]px)', // Replace [HEADER_HEIGHT] with actual header height
          overflow: isFullscreen ? 'hidden' : 'auto'
        }}>
          <Outlet /> {/* Dynamic content renders here */}
        </div>
      </div>
    </div>
  );
};

export default Layout;