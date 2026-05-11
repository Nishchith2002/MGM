



import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';

import cddIcon from '../assets/icons/CDD.png';
import oatIcon from '../assets/icons/oat.png';
import foodIcon from '../assets/icons/Macau FC.png';
import occupancyIcon from '../assets/icons/Macau Occ.png';
import chillerIcon from '../assets/icons/MacauChiller.png';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const InfoCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  padding: '10px 16px',
}));

const IconWrapper = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  backgroundColor: '#f1f1f1',
  marginRight: theme.spacing(2),
  flexShrink: 0,
}));

const ContentWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});


const UsefulInfo = ({ selectedMonth, selectedYear }) => {
  const [climateData, setClimateData] = useState([]);
  const [cotaiData, setCotaiData] = useState([]);
  const [roomOccupancyData, setRoomOccupancyData] = useState([]);
  const [macauConsumptionData, setMacauConsumptionData] = useState([]);
  const [cotaiConsumptionData, setCotaiConsumptionData] = useState([]);
  const [cddValue, setCddValue] = useState(null);
  const [cddChange, setCddChange] = useState(null);
  const [oatValue, setOatValue] = useState(null);
  const [oatChange, setOatChange] = useState(null);
  const [foodCoverData, setFoodCoverData] = useState({
    macauCurrent: null,
    cotaiCurrent: null,
    macauChange: null,
    cotaiChange: null
  });
  const [roomOccupancyDataState, setRoomOccupancyDataState] = useState({
    macauCurrent: null,
    cotaiCurrent: null,
    macauChange: null,
    cotaiChange: null
  });
  const [chillerPlantData, setChillerPlantData] = useState({
    macauPercentage: null,
    cotaiPercentage: null,
    macauConsumption: null,
    cotaiConsumption: null,
    macauChange: null,
    cotaiChange: null
  });

  // Load Macau data
  useEffect(() => {
    fetch("/Data/executiveSummary/Macau_Cost_Corrected.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const cleanedData = result.data.map((row) => {
              const cleanedRow = {};
              Object.keys(row).forEach((key) => {
                cleanedRow[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleanedRow;
            });
            console.log("✅ Cleaned Macau CSV Data:", cleanedData);
            setClimateData(cleanedData);
          },
        });
      });
  }, []);

  // Load Cotai data
  useEffect(() => {
    fetch("/Data/executiveSummary/Cotai_Cost_Corrected.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const cleanedData = result.data.map((row) => {
              const cleanedRow = {};
              Object.keys(row).forEach((key) => {
                cleanedRow[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleanedRow;
            });
            console.log("✅ Cleaned Cotai CSV Data:", cleanedData);
            setCotaiData(cleanedData);
          },
        });
      })
      .catch((error) => {
        console.warn("⚠️ Cotai CSV not found, using default values");
      });
  }, []);

  // Load Room Occupancy data
  useEffect(() => {
    fetch("/Data/executiveSummary/corrected_room_occupancy.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const cleanedData = result.data.map((row) => {
              const cleanedRow = {};
              Object.keys(row).forEach((key) => {
                cleanedRow[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleanedRow;
            });
            console.log("✅ Cleaned Room Occupancy CSV Data:", cleanedData);
            setRoomOccupancyData(cleanedData);
          },
        });
      })
      .catch((error) => {
        console.warn("⚠️ Room Occupancy CSV not found, using default values");
      });
  }, []);

  // Load Macau Consumption Profile data
  useEffect(() => {
    fetch("/Data/executiveSummary/DGLux_Consumption Profile.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const cleanedData = result.data.map((row) => {
              const cleanedRow = {};
              Object.keys(row).forEach((key) => {
                cleanedRow[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleanedRow;
            });
            console.log("✅ Cleaned Macau Consumption Profile CSV Data:", cleanedData);
            setMacauConsumptionData(cleanedData);
          },
        });
      })
      .catch((error) => {
        console.warn("⚠️ Macau Consumption Profile CSV not found");
      });
  }, []);

  // Load Cotai Consumption Profile data (if you have a separate file)
  useEffect(() => {
    fetch("/Data/executiveSummary/Cotai_Consumption Profile.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const cleanedData = result.data.map((row) => {
              const cleanedRow = {};
              Object.keys(row).forEach((key) => {
                cleanedRow[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleanedRow;
            });
            console.log("✅ Cleaned Cotai Consumption Profile CSV Data:", cleanedData);
console.log("🔍 First row columns:", Object.keys(cleanedData[0] || {})); // ADD THIS
            setCotaiConsumptionData(cleanedData);
          },
        });
      })
     .catch((error) => {
  console.warn("⚠️ Cotai Consumption Profile CSV not found");
  setCotaiConsumptionData([]);  // ← CHANGE TO THIS
});
  }, [macauConsumptionData]);

  // Calculate CDD and OAT from Macau data
  useEffect(() => {
    if (climateData.length > 0) {
      const current = climateData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear &&
          parseInt(row['MonthNo']?.toString().trim()) === (months.indexOf(selectedMonth) + 1)
      );
      const previous = climateData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear - 1 &&
          parseInt(row['MonthNo']?.toString().trim()) === (months.indexOf(selectedMonth) + 1)
      );

      console.log("🔍 Current Row:", current);
      console.log("📅 Previous Year Row:", previous);

      if (current && previous) {
        const cddNow = parseFloat(current['CDD']?.toString().trim());
        const cddLast = parseFloat(previous['CDD']?.toString().trim());
        const oatNow = parseFloat(current['Min OAT']?.toString().trim());
        const oatLast = parseFloat(previous['Min OAT']?.toString().trim());

        console.log("✅ CDD Now:", cddNow, " | Last:", cddLast);
        console.log("✅ OAT Now:", oatNow, " | Last:", oatLast);

        if (!isNaN(cddNow)) setCddValue(cddNow);
        if (!isNaN(oatNow)) setOatValue(oatNow);

        if (!isNaN(cddNow) && !isNaN(cddLast)) {
          const diff = ((cddNow - cddLast) / cddLast) * 100;
          setCddChange(diff.toFixed(1));
        }

        if (!isNaN(oatNow) && !isNaN(oatLast)) {
          const oatDiff = ((oatNow - oatLast) / oatLast) * 100;
          setOatChange(oatDiff.toFixed(1));
        }
      }
    }
  }, [climateData, selectedMonth, selectedYear]);

  // Calculate Food Cover data
  useEffect(() => {
    if (climateData.length > 0) {
      // Get Macau Food Cover data
      const macauCurrent = climateData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear &&
          parseInt(row['MonthNo']?.toString().trim()) === (months.indexOf(selectedMonth) + 1)
      );
      const macauPrevious = climateData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear - 1 &&
          parseInt(row['MonthNo']?.toString().trim()) === (months.indexOf(selectedMonth) + 1)
      );

      let macauCurrentValue = null;
      let macauChangeValue = null;

      if (macauCurrent && macauCurrent['Food Cover']) {
        macauCurrentValue = parseFloat(macauCurrent['Food Cover']?.toString().trim());
        
        if (macauPrevious && macauPrevious['Food Cover']) {
          const macauPreviousValue = parseFloat(macauPrevious['Food Cover']?.toString().trim());
          if (!isNaN(macauCurrentValue) && !isNaN(macauPreviousValue)) {
            macauChangeValue = ((macauCurrentValue - macauPreviousValue) / macauPreviousValue) * 100;
          }
        }
      }

      // Get Cotai Food Cover data
      let cotaiCurrentValue = null;
      let cotaiChangeValue = null;

      if (cotaiData.length > 0) {
        const cotaiCurrent = cotaiData.find(
          (row) =>
            parseInt(row['Year']?.toString().trim()) === selectedYear &&
            parseInt(row['MonthNo']?.toString().trim()) === (months.indexOf(selectedMonth) + 1)
        );
        const cotaiPrevious = cotaiData.find(
          (row) =>
            parseInt(row['Year']?.toString().trim()) === selectedYear - 1 &&
            parseInt(row['MonthNo']?.toString().trim()) === (months.indexOf(selectedMonth) + 1)
        );

        if (cotaiCurrent && cotaiCurrent['Food Cover']) {
          cotaiCurrentValue = parseFloat(cotaiCurrent['Food Cover']?.toString().trim());
          
          if (cotaiPrevious && cotaiPrevious['Food Cover']) {
            const cotaiPreviousValue = parseFloat(cotaiPrevious['Food Cover']?.toString().trim());
            if (!isNaN(cotaiCurrentValue) && !isNaN(cotaiPreviousValue)) {
              cotaiChangeValue = ((cotaiCurrentValue - cotaiPreviousValue) / cotaiPreviousValue) * 100;
            }
          }
        }
      }

      setFoodCoverData({
        macauCurrent: macauCurrentValue,
        cotaiCurrent: cotaiCurrentValue,
        macauChange: macauChangeValue,
        cotaiChange: cotaiChangeValue
      });

      console.log("🍽️ Food Cover Data:", {
        macauCurrent: macauCurrentValue,
        cotaiCurrent: cotaiCurrentValue,
        macauChange: macauChangeValue,
        cotaiChange: cotaiChangeValue
      });
    }
  }, [climateData, cotaiData, selectedMonth, selectedYear]);

  // Calculate Room Occupancy data
  useEffect(() => {
    if (roomOccupancyData.length > 0) {
      // Get Macau Room Occupancy data
      const macauCurrent = roomOccupancyData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear &&
          row['Month']?.toString().trim() === selectedMonth &&
          (row['Site']?.toString().trim().includes('Macau') || row['Site']?.toString().trim() === 'Macau')
      );
      const macauPrevious = roomOccupancyData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear - 1 &&
          row['Month']?.toString().trim() === selectedMonth &&
          (row['Site']?.toString().trim().includes('Macau') || row['Site']?.toString().trim() === 'Macau')
      );

      let macauCurrentValue = null;
      let macauChangeValue = null;

      if (macauCurrent && macauCurrent['Physical Room Occupancy']) {
        const occupancyStr = macauCurrent['Physical Room Occupancy']?.toString().trim();
        if (occupancyStr && occupancyStr !== 'No Data') {
          macauCurrentValue = parseFloat(occupancyStr);
          
          if (macauPrevious && macauPrevious['Physical Room Occupancy']) {
            const macauPreviousStr = macauPrevious['Physical Room Occupancy']?.toString().trim();
            if (macauPreviousStr && macauPreviousStr !== 'No Data') {
              const macauPreviousValue = parseFloat(macauPreviousStr);
              if (!isNaN(macauCurrentValue) && !isNaN(macauPreviousValue)) {
                macauChangeValue = ((macauCurrentValue - macauPreviousValue) / macauPreviousValue) * 100;
              }
            }
          }
        }
      }

      // Get Cotai Room Occupancy data
      const cotaiCurrent = roomOccupancyData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear &&
          row['Month']?.toString().trim() === selectedMonth &&
          (row['Site']?.toString().trim().includes('Cotai') || row['Site']?.toString().trim() === 'Cotai')
      );
      const cotaiPrevious = roomOccupancyData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === selectedYear - 1 &&
          row['Month']?.toString().trim() === selectedMonth &&
          (row['Site']?.toString().trim().includes('Cotai') || row['Site']?.toString().trim() === 'Cotai')
      );

      let cotaiCurrentValue = null;
      let cotaiChangeValue = null;

      if (cotaiCurrent && cotaiCurrent['Physical Room Occupancy']) {
        const occupancyStr = cotaiCurrent['Physical Room Occupancy']?.toString().trim();
        if (occupancyStr && occupancyStr !== 'No Data') {
          cotaiCurrentValue = parseFloat(occupancyStr);
          
          if (cotaiPrevious && cotaiPrevious['Physical Room Occupancy']) {
            const cotaiPreviousStr = cotaiPrevious['Physical Room Occupancy']?.toString().trim();
            if (cotaiPreviousStr && cotaiPreviousStr !== 'No Data') {
              const cotaiPreviousValue = parseFloat(cotaiPreviousStr);
              if (!isNaN(cotaiCurrentValue) && !isNaN(cotaiPreviousValue)) {
                cotaiChangeValue = ((cotaiCurrentValue - cotaiPreviousValue) / cotaiPreviousValue) * 100;
              }
            }
          }
        }
      }

      setRoomOccupancyDataState({
        macauCurrent: macauCurrentValue,
        cotaiCurrent: cotaiCurrentValue,
        macauChange: macauChangeValue,
        cotaiChange: cotaiChangeValue
      });

      console.log("🏨 Room Occupancy Data:", {
        macauCurrent: macauCurrentValue,
        cotaiCurrent: cotaiCurrentValue,
        macauChange: macauChangeValue,
        cotaiChange: cotaiChangeValue
      });
    }
  }, [roomOccupancyData, selectedMonth, selectedYear]);

  // Calculate Chiller Plant Electricity Consumption
useEffect(() => {
  const calculateChillerData = (consumptionData, site) => {
    console.log(`🔍 ${site} - Looking for Year: ${selectedYear}, Month: ${selectedMonth}`);
    console.log(`🔍 ${site} - Available years in data:`, [...new Set(consumptionData.map(row => row['Year']))]);
    console.log(`🔍 ${site} - Available months in data:`, [...new Set(consumptionData.map(row => row['Month']))]);
    
    // Try both month formats: numeric and text
    const monthIndex = months.indexOf(selectedMonth) + 1;
    
    // Find current month data - try both formats
    let current = consumptionData.find(
      (row) =>
        parseInt(row['Year']?.toString().trim()) === selectedYear &&
        (parseInt(row['Month']?.toString().trim()) === monthIndex || 
         row['Month']?.toString().trim() === selectedMonth)
    );
    
    console.log(`🔍 ${site} - Current row found:`, current);
    
    // Find previous year data - try both formats
    let previous = consumptionData.find(
      (row) =>
        parseInt(row['Year']?.toString().trim()) === selectedYear - 1 &&
        (parseInt(row['Month']?.toString().trim()) === monthIndex || 
         row['Month']?.toString().trim() === selectedMonth)
    );
    
    console.log(`🔍 ${site} - Previous row found:`, previous);
    
    // Fallback logic for missing current data
    if (!current) {
      console.log(`⚠️ ${site} - No data for ${selectedYear}, trying to find latest available year`);
      const availableYears = consumptionData
        .map(row => parseInt(row['Year']?.toString().trim()))
        .filter(year => !isNaN(year));
      
      if (availableYears.length > 0) {
        const latestYear = Math.max(...availableYears);
        console.log(`⚠️ ${site} - Using latest year: ${latestYear} for month ${selectedMonth}`);
        
        current = consumptionData.find(
          (row) =>
            parseInt(row['Year']?.toString().trim()) === latestYear &&
            (parseInt(row['Month']?.toString().trim()) === monthIndex || 
             row['Month']?.toString().trim() === selectedMonth)
        );
        
        // If still no data found, try to find any data for this month in any year
        if (!current) {
          console.log(`⚠️ ${site} - No data for ${selectedMonth} in ${latestYear}, trying any year`);
          const availableMonthData = consumptionData.filter(row => 
            parseInt(row['Month']?.toString().trim()) === monthIndex || 
            row['Month']?.toString().trim() === selectedMonth
          );
          
          if (availableMonthData.length > 0) {
            // Get the most recent data for this month
            current = availableMonthData.reduce((latest, row) => {
              const rowYear = parseInt(row['Year']?.toString().trim());
              const latestYear = parseInt(latest['Year']?.toString().trim());
              return rowYear > latestYear ? row : latest;
            });
            console.log(`⚠️ ${site} - Using data from year ${current['Year']} for month ${selectedMonth}`);
          }
        }
      }
    }
    
    if (!current) {
      console.log(`❌ ${site} - No data found for ${selectedMonth} in any year`);
      return { percentage: null, consumption: null, change: null };
    }
    
    // Calculate chiller plant consumption
    const currentChillerPlant = parseFloat(
      current['Chiller Plant']?.toString().replace(/,/g, '').trim() || 0
    );
    
    // Calculate total consumption for percentage calculation
    const calculateTotalConsumption = (row) => {
      const fields = [
        'Chiller Plant', 'Airside Equipment', 'Kitchen & Restaurant', 'Casino',
        'Hotel Tower', 'BOH', 'Lifts & Escalators', 'Art Museum', 
        'Fantastic Box', 'Miscellaneous', 'Heat Pump Plant'
      ];
      
      return fields.reduce((total, field) => {
        const value = parseFloat(row[field]?.toString().replace(/,/g, '').trim() || 0);
        return total + value;
      }, 0);
    };
    
    const totalCurrentConsumption = calculateTotalConsumption(current);
    const currentPercentage = totalCurrentConsumption > 0 ? 
      (currentChillerPlant / totalCurrentConsumption) * 100 : 0;
    
    // Calculate change based on absolute consumption values (not percentages)
    let percentageChange = null;
    if (previous) {
      const previousChillerPlant = parseFloat(
        previous['Chiller Plant']?.toString().replace(/,/g, '').trim() || 0
      );
      
      // Calculate percentage change based on absolute consumption values
      if (previousChillerPlant > 0) {
        percentageChange = ((currentChillerPlant - previousChillerPlant) / previousChillerPlant) * 100;
      }
    } else {
      // If no previous year data, try to find comparison data
      const currentYear = parseInt(current['Year']?.toString().trim());
      const comparisonYear = currentYear - 1;
      
      const comparison = consumptionData.find(
        (row) =>
          parseInt(row['Year']?.toString().trim()) === comparisonYear &&
          (parseInt(row['Month']?.toString().trim()) === monthIndex || 
           row['Month']?.toString().trim() === selectedMonth)
      );
      
      if (comparison) {
        const comparisonChillerPlant = parseFloat(
          comparison['Chiller Plant']?.toString().replace(/,/g, '').trim() || 0
        );
        
        // Calculate percentage change based on absolute consumption values
        if (comparisonChillerPlant > 0) {
          percentageChange = ((currentChillerPlant - comparisonChillerPlant) / comparisonChillerPlant) * 100;
        }
      }
    }
    
    console.log(`✅ ${site} - Chiller Plant Calculation:`, {
      currentChillerPlant,
      totalCurrentConsumption,
      currentPercentage: currentPercentage.toFixed(2) + '%',
      previousChillerPlant: previous ? parseFloat(previous['Chiller Plant']?.toString().replace(/,/g, '').trim() || 0) : 'N/A',
      percentageChange: percentageChange ? percentageChange.toFixed(2) + '%' : 'N/A',
      year: current['Year'],
      month: current['Month']
    });
    
    return {
      percentage: currentPercentage,
      consumption: currentChillerPlant,
      change: percentageChange
    };
  };
  
  // Calculate data for both sites
  let macauChillerData = { percentage: null, consumption: null, change: null };
  let cotaiChillerData = { percentage: null, consumption: null, change: null };
  
  // Calculate Macau data
  if (macauConsumptionData && macauConsumptionData.length > 0) {
    macauChillerData = calculateChillerData(macauConsumptionData, 'Macau');
  }
  
  // Calculate Cotai data
  if (cotaiConsumptionData && cotaiConsumptionData.length > 0) {
    cotaiChillerData = calculateChillerData(cotaiConsumptionData, 'Cotai');
  } else if (macauConsumptionData && macauConsumptionData.length > 0) {
    // Fallback: use Macau data for Cotai if Cotai data is not available
    console.log('⚠️ Using Macau data as fallback for Cotai');
    cotaiChillerData = calculateChillerData(macauConsumptionData, 'Cotai (fallback)');
  }
  
  // Update state
  setChillerPlantData({
    macauPercentage: macauChillerData.percentage,
    cotaiPercentage: cotaiChillerData.percentage,
    macauConsumption: macauChillerData.consumption,
    cotaiConsumption: cotaiChillerData.consumption,
    macauChange: macauChillerData.change,
    cotaiChange: cotaiChillerData.change
  });
  
}, [macauConsumptionData, cotaiConsumptionData, selectedMonth, selectedYear]);

  const items = [
    {
      icon: cddIcon,
      title: 'CDD',
      value: cddValue !== null ? `${cddValue}` : '20.1',
      change: cddChange !== null ? `${cddChange >= 0 ? '+' : ''}${cddChange}%` : '+37.4%',
      color: cddChange && cddChange < 0 ? 'red' : 'green',
    },
    {
      icon: oatIcon,
      title: 'Min. OAT',
      value: oatValue !== null ? `${oatValue}°C` : '12.6°C',
      change: oatChange !== null ? `${oatChange >= 0 ? '+' : ''}${oatChange}%` : '+4.17%',
      color: oatChange && oatChange < 0 ? 'red' : 'green',
    },
    {
      icon: foodIcon,
      title: 'Food Cover',
      line1: foodCoverData.macauCurrent !== null ? `Macau $${foodCoverData.macauCurrent.toLocaleString()}` : 'Macau $278,751',
      line2: foodCoverData.cotaiCurrent !== null ? `Cotai $${foodCoverData.cotaiCurrent.toLocaleString()}` : 'Cotai $368,921',
      change1: foodCoverData.macauChange !== null ? `${foodCoverData.macauChange >= 0 ? '+' : ''}${foodCoverData.macauChange.toFixed(1)}%` : '+23.7%',
      change2: foodCoverData.cotaiChange !== null ? `${foodCoverData.cotaiChange >= 0 ? '+' : ''}${foodCoverData.cotaiChange.toFixed(1)}%` : '+91.7%',
      color: 'green',
    },
    {
      icon: occupancyIcon,
      title: 'Room Occupancy Rate',
      line1: roomOccupancyDataState.macauCurrent !== null ? `Macau ${roomOccupancyDataState.macauCurrent.toFixed(1)}%` : 'Macau 91.5%',
      line2: roomOccupancyDataState.cotaiCurrent !== null ? `Cotai ${roomOccupancyDataState.cotaiCurrent.toFixed(1)}%` : 'Cotai 95.2%',
      change1: roomOccupancyDataState.macauChange !== null ? `${roomOccupancyDataState.macauChange >= 0 ? '+' : ''}${roomOccupancyDataState.macauChange.toFixed(1)}%` : '+3.0%',
      change2: roomOccupancyDataState.cotaiChange !== null ? `${roomOccupancyDataState.cotaiChange >= 0 ? '+' : ''}${roomOccupancyDataState.cotaiChange.toFixed(1)}%` : '+3.6%',
      color: 'green',
    },
    {
      icon: chillerIcon,
      title: 'Chiller Plant Electricity Consumption',
      line1: chillerPlantData.macauPercentage !== null ? 
        `Macau ${chillerPlantData.macauPercentage.toFixed(1)}% (${chillerPlantData.macauConsumption.toLocaleString()} kWh)` : 
        'Macau 13.2% (558,659 kWh)',
      line2: chillerPlantData.cotaiPercentage !== null ? 
        `Cotai ${chillerPlantData.cotaiPercentage.toFixed(1)}% (${chillerPlantData.cotaiConsumption.toLocaleString()} kWh)` : 
        'Cotai 7.7% (622,770 kWh)',
      change1: chillerPlantData.macauChange !== null ? `${chillerPlantData.macauChange >= 0 ? '+' : ''}${chillerPlantData.macauChange.toFixed(1)}%` : '-23.5%',
      change2: chillerPlantData.cotaiChange !== null ? `${chillerPlantData.cotaiChange >= 0 ? '+' : ''}${chillerPlantData.cotaiChange.toFixed(1)}%` : '-34.35%',
      color: 'red',
    },
  ];

  return (
    <>
     <Typography
      variant="h6"
      fontWeight={700}
      color='#e95420' 
      sx={{ mb: 2, padding: "0px 0px 20px 0px", }}
    >
      Useful Information
    </Typography>

   <Paper
  elevation={1}
  sx={{
    borderRadius: 2,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    height:"770px",
    bgcolor:"#f8f9fa",
    width:"500px"
  }}
>
 

  {/* ✅ First row: CDD & Min. OAT side-by-side */}
  {/* ✅ First row: CDD & Min. OAT side-by-side with icon on left and text on right */}
<Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    mb: 5,
    gap: 2,
  }}
>
  {[items[0], items[1]].map((item, idx) => (
    <Box
      key={idx}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        flex: 1,
        // backgroundColor: '#f9f9f9',
        padding: 1.5,
        // borderRadius: 2,
      }}
    >
      {/* Left icon */}
      
        <img
          src={item.icon}
          alt={item.title}
          style={{ width: '106px', height: '106px', objectFit: 'contain' }}
        />
     

      {/* Right text content */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {item.title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.3 }}>
          {item.value}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>
          Compare to same month Last Yr:
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '13px',
            // color: item.color || 'gray',
            fontWeight: 500,
          }}
        >
          {item.change}
        </Typography>
      </Box>
    </Box>
  ))}
</Box>


  {/* ✅ Remaining items: Food Cover, Room Occupancy, Chiller Plant */}
  {items.slice(2).map((item, idx) => (
    <InfoCard
      key={idx}
      sx={{
        // borderBottom: idx !== items.length - 3 ? '1px solid #eee' : 'none',
        borderBottom: 'none',

        pb: 1.5,
        mb: 6,
      }}
    >
   {!['Food Cover', 'Room Occupancy Rate', 'Chiller Plant Electricity Consumption'].includes(item.title) && (
 <IconWrapper variant="rounded" sx={{ width: 80, height: 80 }}>
  <img
    src={item.icon}
    alt={item.title}
    style={{ width: '500px', height: '500px', objectFit: 'contain' }}
  />
</IconWrapper>

)}



      <ContentWrapper>
        {/* <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          {item.title}
        </Typography> */}

        {/* Line-based metrics */}
     {['Food Cover', 'Room Occupancy Rate', 'Chiller Plant Electricity Consumption'].includes(item.title) ? (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    }}
  >
    {/* Icon */}
    {/* <IconWrapper  sx={{ width: 60, height: 60 }}> */}
      <img
        src={item.icon}
        alt={item.title}
        style={{ width: '106px', height: '106px', objectFit: 'contain' }}
      />
    {/* </IconWrapper> */}

    {/* Content */}
    <Box sx={{ flex: 1 }}>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        align="center"
        sx={{ mb: 0.5 }}
      >
        {item.title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {/* MACAU */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: '14px' }}>
            Macau&nbsp;&nbsp;
            {item.line1?.replace('Macau ', '').split('(')[0]}
          </Typography>
          {/* <Typography variant="caption" sx={{ fontSize: '13px', color: '#555' }}>
            {/* {item.line1?.match(/\((.*?)\)/)?.[1] ?? 'kWh'} */}
          {/* </Typography><br/> */} 
          <Typography
            variant="caption"
            sx={{ fontSize: '11px', fontStyle: 'italic', color: '#666' }}
          >
            Compare to same month Last Yr:<br />
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: '13px', fontWeight: 500,  }}
          >
            {item.change1}
          </Typography>
        </Box>

        {/* COTAI */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: '14px' }}>
            Cotai&nbsp;&nbsp;
            {item.line2?.replace('Cotai ', '').split('(')[0]}
          </Typography>
          {/* <Typography variant="caption" sx={{ fontSize: '13px', color: '#555' }}>
            {/* {item.line2?.match(/\((.*?)\)/)?.[1] ?? 'kWh'} */}
          {/* </Typography><br/> */} 
          <Typography
            variant="caption"
            sx={{ fontSize: '11px', fontStyle: 'italic', color: '#666' }}
          >
            Compare to same month Last Yr:<br />
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: '13px', fontWeight: 500,  }}
          >
            {item.change2}
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
) : (
  // fallback for other items
  <>
    <Typography
      variant="body2"
      sx={{ mb: 0.25, fontSize: '14px', fontWeight: 500 }}
    >
      {item.line1}
    </Typography><br/ >
    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
      {item.line2}
    </Typography>
    <Typography
      variant="caption"
      sx={{ color: item.color || 'gray', fontSize: '0.75rem' }}
    >
      Compare to same month Last Yr: {item.change1} | {item.change2}
    </Typography>
  </>
)}



      </ContentWrapper>
    </InfoCard>
  ))}
</Paper>
</>


  );
};

export default UsefulInfo;