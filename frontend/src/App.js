// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Layout from './components/layout/layout';
import Home from './pages/Home';
import Utility from './pages/Utility';
import CarbonEmissionsDashboard from './pages/CarbonEmissionsDashboard';
import HeatMap from './pages/HeatMap';
import TemperatureGraph from './pages/HeatMap';
import HeatMapSummary from './pages/HeatMapSummary';
import CotaiHeatMap from './pages/CotaiHeatMap';
import ExecutiveSummary from './pages/ExecutiveSummary';
import WineCellur from './pages/WineCellur';
import Login from './pages/Login';
import AuthGuard from './components/AuthGuard';
import AdminCSVManager from './components/AdminCSVManager';
import Energy from './pages/Energy';
import Gas from './pages/Gas';
import Water from './pages/Water';
import CsvManager from './pages/CsvManager';
import PlantDashboard from './components/Plantdashboard';
import Library from './pages/libarary';
import SensorMonitoring from './pages/SensorMonitoring';
// import solar2_white from "./pages/MGMScene"
import MGMScene from './pages/MGMScene';
import MFMCustomer from "./pages/MFMCustomer"

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Login Page - No Navbar/Layout - Public Route */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Must have AuthGuard */}
        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            {/* Home Page */}
            <Route path="/Home" element={<ExecutiveSummary />} />

            {/* Utility Pages */}
            <Route path="/Utility" element={<Utility />} />
            <Route path="/energy" element={<Energy />} />
            <Route path="/gas" element={<Gas />} />
            <Route path="/water" element={<Water />} />

            {/* Carbon Emissions */}
            <Route path="/CarbonEmissionsDashboard" element={<CarbonEmissionsDashboard />} />

            {/* HeatMap Pages */}
            <Route path="/HeatMap" element={<HeatMapSummary />} />
            <Route path="/HeatMap/detail" element={<HeatMap />} />
            <Route path="/HeatMap/cotai" element={<CotaiHeatMap />} />

            {/* Other Pages */}
            <Route path="/WineCellur" element={<WineCellur />} />
            <Route path="/plant" element={<PlantDashboard />} />
            <Route path="/mgm" element={<MGMScene />} />
            <Route path="/csv-manager" element={<CsvManager />} />
            <Route path="/LibraryPage" element={<Library />} />
            <Route path="/SensorMonitoring" element={<SensorMonitoring />} />
            <Route path="/admin/csv-manager" element={<AdminCSVManager />} />   
             <Route path="/MFMCustomer" element={<MFMCustomer />} /> 
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
