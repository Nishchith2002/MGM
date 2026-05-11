import React, { useState, useEffect } from "react";
import ChillerDashboard from "./ChillerDashboard";
import MacauChillerDashboard from "./MacauChillerDashboard";  // ✅ UPDATED

const PlantDashboard = () => {
  const [selectedSite, setSelectedSite] = useState(() => {
    return localStorage.getItem("selectedSite") || "Cotai";
  });

  useEffect(() => {
    const handleSiteChange = () => {
      const newSite = localStorage.getItem("selectedSite") || "Cotai";
      console.log(" Site changed to:", newSite);
      setSelectedSite(newSite);
    };

    window.addEventListener("siteChange", handleSiteChange);
    return () => window.removeEventListener("siteChange", handleSiteChange);
  }, []);

  console.log(" PlantDashboard rendering with site:", selectedSite);

  if (selectedSite === "Macho") {
    console.log("✅ Rendering MacauChillerDashboard");
    return <MacauChillerDashboard />;
  } else if (selectedSite === "Cotai") {
    console.log("✅ Rendering Cotai ChillerDashboard");
    return <ChillerDashboard />;
  } else {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Select a site from the navbar (Cotai or Macau)</h2>
        <p>Current selection: {selectedSite}</p>
      </div>
    );
  }
};

export default PlantDashboard;