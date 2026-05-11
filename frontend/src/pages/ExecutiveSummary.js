

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Box, Grid, Typography, useMediaQuery, useTheme,
  Paper, Avatar, FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Image imports
import iso from '../assets/icons/iso.png';
import eui from '../assets/icons/energyLgHovered.png';
import electricity from '../assets/icons/energyDG.png';
import gas from '../assets/icons/gasHovered.png';
import water from '../assets/icons/waterHovered.png';
import cost from '../assets/icons/gear.png';
import cdd from '../assets/icons/CDD.png';
import oat from '../assets/icons/oat.png';
import food from '../assets/icons/Macau FC.png';
import occupancy from '../assets/icons/Macau Occ.png';
import chiller from '../assets/icons/MacauChiller.png';
import CotaiComponent from './CotaiDataColumn';
import UsefulInfo from './UsefulInfo';
const ImageMap = { iso, eui, electricity, gas, water, cost, cdd, oat, food, occupancy, chiller };

const MetricCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  marginBottom: '10px',
  borderRadius: 8,
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
}));

const MetricText = ({ label, value, unit, diff, isPositive, gj }) => (
  <Box ml={2}>
    <Typography variant="body2" fontWeight={600}>{label}</Typography>
    <Typography variant="h6">{value} {unit}</Typography>
    {gj && <Typography variant="body2" color="text.secondary">{gj}</Typography>}
    <Typography variant="caption" color="text.secondary">
      Compare to same month Last Yr:
      <span style={{ color: isPositive ? 'green' : 'red', marginLeft: 4 }}>
        {diff} {isPositive ? '▼' : '▲'}
      </span>
    </Typography>
  </Box>
);

const MetricImage = ({ icon }) => {
 const size = icon === 'iso' || icon === 'eui' || icon === 'electricity' || icon === 'gas' || icon === 'water'|| icon === 'cost' ? 88 : 64;

  return (
    <Avatar sx={{ bgcolor: 'white', width: size, height: size }} variant="rounded">
      <img
        src={ImageMap[icon]}
        alt={icon}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </Avatar>
  );
};


const DataColumn = ({ title, data, euiChange, electricityChangeYoY,gasMonthCompare,waterMonthCompare,costMonthCompare }) => (


  <Grid item xs={12} md={4}>
    <Typography variant="h6" sx={{ mb: 5, color: '#d75a00', fontWeight: 700 }}>{title}</Typography>
  {data.map(({ label, value, unit, diff, icon, isPositive, gj }, idx) => (
<MetricCard
  key={idx}
  sx={{
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 2,
    width: ['ISO', 'EUI'].includes(label) ? '500px' : '100%',
    minHeight: label === "ISO" ? '110px' : 'auto',
    backgroundColor: "#f8f9fa" // ✅ This line is now correct
  }}
>

    <Box sx={{ display: 'flex', alignItems: 'center', }}>
      <MetricImage icon={icon} />
      <Box ml={6}>
   {['ISO', 'EUI', 'Electricity', 'Gas', 'Water', 'Cost'].includes(label) ? (

  <>
 <Typography variant="caption" sx={{ fontSize: "9px", color: '#555', mb: 0.5 }}>
  {label === 'Cost' && 'YTD total utility cost saving compared to last year'}
  {label === 'ISO' && 'Target: 13% by 2025 Baseline: CY 2019'}
  {label === 'EUI' && 'YTD actual electricity utilization intensity'}
  {label === 'Electricity' && 'YTD actual electricity saving compared to last year'}
  {label === 'Gas' && 'YTD actual gas saving compared to last year'}
  {label === 'Water' && 'YTD actual water saving compared to last year'}
</Typography>


  <Box display="flex" alignItems="center" gap="4px">
  <Typography variant="h6" sx={{ color: '#000', fontWeight: 700 }}>
   {value}
  </Typography>
  <Typography variant="h5" sx={{ color: isPositive ? 'green' : 'red', fontWeight: 700 }}>
    {isPositive ? '▼' : '▲'}
  </Typography>
</Box>

    {label === 'Cost' ? (
  <Typography variant="body2" sx={{ fontWeight: 600 }}>
    {gj} {/* shows “817,585 MOP” */}
  </Typography>
) : (
  <Typography variant="body2" sx={{ fontWeight: 300 }}>
    {gj}
  </Typography>
)}

  </>
) : (
  <>
    <Typography variant="body2" fontWeight={600}>{label}</Typography>
    {gj && <Typography variant="body2" color="text.secondary">{gj}</Typography>}
    <Typography variant="caption" color="text.secondary">
      Compare to same month Last Yr:
      <span style={{ color: isPositive ? 'green' : 'red', marginLeft: 4 }}>
        {diff} {isPositive ? '▼' : '▲'}
      </span>
    </Typography>
  </>
)}

      </Box>
    </Box>

{label === 'ISO' && (
  <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
    <Typography variant="caption" color="#000">Projected saving<br />by 2025</Typography>
    <Typography variant="body2" fontWeight={500}>-13.0%</Typography>
  </Box>
)}

{label === 'EUI' && (
  <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary"> Compare to same<br></br> month Last Yr<br></br></Typography>
    <Typography variant="body2" fontWeight={500}>
  
  {euiChange !== null ? (
    <span style={{ color: euiChange < 0 ? "green" : "red" }}>
      {Math.abs(euiChange)}% {euiChange < 0 ? "▼" : "▲"}
    </span>
  ) : (
    "N/A"
  )}
</Typography>



  </Box>
)}
{label === 'Electricity' && electricityChangeYoY && (
  <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary">
      Compare to same<br />month Last Yr.
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        color: electricityChangeYoY.isPositive ? 'green' : '#d32f2f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
      }}
    >
      {electricityChangeYoY.percent}{' '}
      <span>{electricityChangeYoY.isPositive ? '▼' : '▲'}</span>
    </Typography>
  </Box>
)}


{label === 'Gas' && gasMonthCompare && (
  <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary">
      Compare to same<br />month Last Yr.
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        color: gasMonthCompare.isPositive ? 'green' : '#d32f2f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
      }}
    >
      {gasMonthCompare.percent} <span>{gasMonthCompare.isPositive ? '▼' : '▲'}</span>
    </Typography>
  </Box>
)}


{label === 'Water' && waterMonthCompare && (
  <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary">
      Compare to same<br />month Last Yr.
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        color: waterMonthCompare.isPositive ? 'green' : '#d32f2f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
      }}
    >
      {waterMonthCompare.percent}
      <span>{waterMonthCompare.isPositive ? '▼' : '▲'}</span>
    </Typography>
  </Box>
)}


{label === 'Cost' && costMonthCompare && (
  <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
    <Typography variant="caption" color="text.secondary">
      Compare to same<br />month Last Yr.
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        color: costMonthCompare.isPositive ? 'green' : '#d32f2f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
      }}
    >
      {costMonthCompare.percent}
      <span>{costMonthCompare.isPositive ? '▼' : '▲'}</span>
    </Typography>
  </Box>
)}











  </MetricCard>
))}

  </Grid>
);


export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [isoSaving, setIsoSaving] = useState({ percent: '', gj: '' });
  const [euiValue, setEuiValue] = useState(null);
  const [eui, setEUI] = useState(0);
const [euiDiff, setEuiDiff] = useState('N/A');
const [euiIsPositive, setEuiIsPositive] = useState(false);
const [euiChange, setEuiChange] = useState(null); // To track % change from last year
const [electricityValue, setElectricityValue] = useState({
  value: 0,
  percent: 0,
  isPositive: false,
  difference: 0,
  compareLastYear: 0
});

const [electricityChangeYoY, setElectricityChangeYoY] = useState(null);
const [ytdCurrent, setYtdCurrent] = useState(null);
const [ytdPrevious, setYtdPrevious] = useState(null);
const [gasChangeYoY, setGasChangeYoY] = useState(null);
const [gasMonthCompare, setGasMonthCompare] = useState(null);
const [waterChangeYoY, setWaterChangeYoY] = useState(null);
const [waterMonthCompare, setWaterMonthCompare] = useState(null);
const [waterValue, setWaterValue] = useState({
  percent: null,
  value: 0,
  isPositive: false
});
const [costValue, setCostValue] = useState({
  percent: null,
  value: 0,
  isPositive: false
});

const [costMonthCompare, setCostMonthCompare] = useState(null);
const [costCsvData, setCostCsvData] = useState([]);



















  // Load CSV data only once
  useEffect(() => {
   Papa.parse("/Data/executiveSummary/Macau_Dashboard.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true,
  complete: (results) => {
    const rawRows = results.data;
    console.log("=== CSV LOADED ===");
    console.log("Total rows loaded:", rawRows.length);
    console.log("Headers:", results.meta.fields);
    console.log("First 3 rows:", rawRows.slice(0, 3));

    // Cleanup keys and rows
    const cleanedData = rawRows.map((row, idx) => {
      const cleanedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        const cleanKey = key?.trim();
        cleanedRow[cleanKey] = typeof value === 'string' ? value.trim() : value;
      });
      return cleanedRow;
    });

    // Extract year values
    const sampleYears = cleanedData.map((r) => r.Year);
    const yearValues = sampleYears.filter(y => y && !isNaN(y));
    const uniqueYears = [...new Set(yearValues)].map(Number).sort((a, b) => a - b);

    console.log("Sample Year values:", sampleYears);
    console.log("Valid years:", uniqueYears);

    setCsvData(cleanedData);
    setAvailableYears(uniqueYears);

    if (uniqueYears.length > 0) {
      setSelectedYear(uniqueYears[uniqueYears.length - 1]); // Select latest year
    }
  },
  error: (error) => {
    console.error("Error loading CSV:", error);
  }
});

  }, []);


useEffect(() => {
  Papa.parse("/Data/executiveSummary/Macau_Cost_Corrected.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: (results) => {
      const cleaned = results.data.map((row) => {
        const cleanedRow = {};
        Object.entries(row).forEach(([key, value]) => {
          const cleanKey = key?.trim();
          cleanedRow[cleanKey] = typeof value === 'string' ? value.trim() : value;
        });
        return cleanedRow;
      });

      setCostCsvData(cleaned);
      console.log("✅ Loaded cost CSV:", cleaned.slice(0, 3));
    },
    error: (error) => {
      console.error("❌ Error loading cost CSV:", error);
    }
  });
}, []);




useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  // ✅ YTD rows
  const ytdRowsCurrent = csvData.filter(row =>
    Number(row.Year) === Number(selectedYear) &&
    months.findIndex(m => m === String(row.Month).trim()) <= selectedMonthIndex
  );

  const ytdRowsPrevious = csvData.filter(row =>
    Number(row.Year) === Number(selectedYear - 1) &&
    months.findIndex(m => m === String(row.Month).trim()) <= selectedMonthIndex
  );

  // ✅ ISO Calculation
  const totalActualGJ = ytdRowsCurrent.reduce(
    (sum, row) => sum + parseFloat(row['Total Actual Energy Consumption_GJ'] || 0),
    0
  );
  const totalNormalizedGJ = ytdRowsCurrent.reduce(
    (sum, row) => sum + parseFloat(row['Total Normalized Energy Consumption_GJ'] || 0),
    0
  );
  if (totalNormalizedGJ && !isNaN(totalActualGJ)) {
    const diff = totalActualGJ - totalNormalizedGJ;
    const isoSavingPercent = (diff / totalNormalizedGJ) * 100;
    setIsoSaving({
      percent: `${isoSavingPercent.toFixed(1)}%`,
      gj: `${Math.abs(diff.toFixed(0)).toLocaleString()} GJ`,
    });
  } else {
    setIsoSaving({ percent: 'N/A', gj: 'N/A' });
  }

  // ✅ EUI
  const AREA_M2 = 211545;
  const totalElectricityYTD = ytdRowsCurrent.reduce((sum, row) => {
    const value = row['Actual Electricity Consumption'];
    const cleaned = typeof value === 'string' ? value.replace(/,/g, '') : value;
    return sum + (parseFloat(cleaned) || 0);
  }, 0);
  const eui = totalElectricityYTD / AREA_M2;
  setEuiValue(eui?.toFixed(1));

  // ✅ Electricity YTD Difference & % Change
  const sumElectricity = (rows) =>
    rows.reduce((sum, row) => {
      const val = row['Actual Electricity Consumption'];
      const cleaned = typeof val === 'string' ? val.replace(/,/g, '') : val;
      return sum + (parseFloat(cleaned) || 0);
    }, 0);

  const ytdCurrent = sumElectricity(ytdRowsCurrent);
  const ytdPrevious = sumElectricity(ytdRowsPrevious);

  const elecDiff = ytdCurrent - ytdPrevious;
  const elecChange = ytdPrevious !== 0 ? (elecDiff / ytdPrevious) * 100 : null;

  setElectricityChangeYoY({
    value: elecDiff,
    percent: elecChange !== null ? `${elecChange.toFixed(1)}%` : 'N/A',
    isPositive: elecDiff < 0,
  });

  

}, [csvData, selectedYear, selectedMonth]);

useEffect(() => {
  if (!csvData || !selectedYear || !selectedMonth) return;

  const area = 211545;
  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  const sumElectricity = (rows) =>
    rows.reduce((sum, row) => {
      const val = row['Actual Electricity Consumption'];
      const cleaned = typeof val === 'string' ? val.replace(/,/g, '') : val;
      const parsed = parseFloat(cleaned);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);

  // === LEFT: YTD total actual electricity
  const ytdRowsCurrent = csvData.filter(row =>
    Number(row.Year) === Number(selectedYear) &&
    months.findIndex(m => m === String(row.Month).trim()) <= selectedMonthIndex
  );

  const ytdRowsPrevious = csvData.filter(row =>
    Number(row.Year) === Number(selectedYear - 1) &&
    months.findIndex(m => m === String(row.Month).trim()) <= selectedMonthIndex
  );

  const totalCurrent = sumElectricity(ytdRowsCurrent);
  const totalPrevious = sumElectricity(ytdRowsPrevious);

  const diff = totalCurrent - totalPrevious;
  const change = totalPrevious !== 0 ? (diff / totalPrevious) * 100 : null;

  setYtdCurrent(totalCurrent);  // NEW STATE
  setYtdPrevious(totalPrevious); // NEW STATE

 const euiValue = totalCurrent / area;

setElectricityValue({
  value: euiValue.toFixed(1), // ✅ Use EUI not total kWh
  percent: change !== null ? change.toFixed(1) : 'N/A',
  isPositive: diff < 0,
  difference: diff,
  compareLastYear: change,
});



  setEuiValue(euiValue.toFixed(1));  // Show e.g. 23.2

  // === RIGHT: same month YoY
  const currentMonthRow = csvData.find(
    (row) => Number(row.Year) === Number(selectedYear) && row.Month === selectedMonth
  );
  const previousMonthRow = csvData.find(
    (row) => Number(row.Year) === Number(selectedYear - 1) && row.Month === selectedMonth
  );

  if (currentMonthRow && previousMonthRow) {
    const curr = parseFloat(currentMonthRow["Actual Electricity Consumption"]);
    const prev = parseFloat(previousMonthRow["Actual Electricity Consumption"]);

    if (!isNaN(curr) && !isNaN(prev) && prev !== 0) {
      const percentChange = ((curr - prev) / prev) * 100;

      setElectricityChangeYoY({
        value: curr - prev,
        percent: `${percentChange.toFixed(1)}%`,
        isPositive: percentChange < 0,
      });

      // EUI comparison
      const euiCurr = curr / area;
      const euiPrev = prev / area;

      if (!isNaN(euiCurr) && !isNaN(euiPrev) && euiPrev !== 0) {
        const euiPercentChange = ((euiCurr - euiPrev) / euiPrev) * 100;

        setEuiChange(euiPercentChange.toFixed(1));
        setEuiIsPositive(euiPercentChange < 0);
      } else {
        setEuiChange(null);
        setEuiIsPositive(false);
      }

    } else {
      setElectricityChangeYoY(null);
      setEuiChange(null);
      setEuiIsPositive(false);
    }
  } else {
    console.warn("⚠️ Missing data for same-month comparison");
    setElectricityChangeYoY(null);
    setEuiChange(null);
    setEuiIsPositive(false);
  }

}, [csvData, selectedYear, selectedMonth]);



useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  let total2025 = 0;
  let total2024 = 0;

  csvData.forEach((row) => {
    const year = parseInt(row["Year"]);
    const month = months.findIndex(m => m === String(row["Month"]).trim());

    const gas = parseFloat(row["Actual  Gas Consumption_GJ"]) || 0;

    if (month <= selectedMonthIndex) {
      if (year === selectedYear) {
        total2025 += gas;
      } else if (year === selectedYear - 1) {
        total2024 += gas;
      }
    }
  });

  const diff = total2025 - total2024;
  const percent = total2024 > 0 ? ((diff / total2024) * 100).toFixed(1) : null;

  setGasChangeYoY({
    percent,
    value: diff,
    isPositive: diff < 0
  });
}, [csvData, selectedMonth, selectedYear]);



useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const currentMonthRow = csvData.find(
    (row) =>
      Number(row.Year) === Number(selectedYear) &&
      row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  const previousMonthRow = csvData.find(
    (row) =>
      Number(row.Year) === Number(selectedYear - 1) &&
      row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  if (currentMonthRow && previousMonthRow) {
    const curr = parseFloat(currentMonthRow["Actual  Gas Consumption_GJ"]) || 0;
    const prev = parseFloat(previousMonthRow["Actual  Gas Consumption_GJ"]) || 0;

    if (prev > 0) {
      const percentChange = ((curr - prev) / prev) * 100;
      setGasMonthCompare({
        percent: `${Math.abs(percentChange).toFixed(1)}%`,
        isPositive: percentChange < 0,
      });
    } else {
      setGasMonthCompare(null);
    }
  } else {
    setGasMonthCompare(null);
  }
}, [csvData, selectedMonth, selectedYear]);

useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  let total2025 = 0;
  let total2024 = 0;

  csvData.forEach((row) => {
    const year = parseInt(row["Year"]);
    const month = months.findIndex(m => m === String(row["Month"]).trim());

    const water = parseFloat(row["Actual Water Consumption"]) || 0;

    if (month <= selectedMonthIndex) {
      if (year === selectedYear) {
        total2025 += water;
      } else if (year === selectedYear - 1) {
        total2024 += water;
      }
    }
  });

  const diff = total2025 - total2024;
  const percent = total2024 > 0 ? ((diff / total2024) * 100).toFixed(1) : null;

  setWaterValue({
    percent,
    value: diff,
    isPositive: diff < 0
  });
}, [csvData, selectedMonth, selectedYear]);




useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const currentMonthRow = csvData.find(
    (row) =>
      Number(row.Year) === Number(selectedYear) &&
      row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  const previousMonthRow = csvData.find(
    (row) =>
      Number(row.Year) === Number(selectedYear - 1) &&
      row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  if (currentMonthRow && previousMonthRow) {
    const curr = parseFloat(currentMonthRow["Actual Water Consumption"]) || 0;
    const prev = parseFloat(previousMonthRow["Actual Water Consumption"]) || 0;

    if (prev > 0) {
      const percentChange = ((curr - prev) / prev) * 100;
      setWaterMonthCompare({
        percent: `${Math.abs(percentChange).toFixed(1)}%`,
        isPositive: percentChange < 0,
      });
    } else {
      setWaterMonthCompare(null);
    }
  } else {
    setWaterMonthCompare(null);
  }
}, [csvData, selectedMonth, selectedYear]);






useEffect(() => {
  if (!costCsvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  let total2025 = 0;
  let total2024 = 0;

  costCsvData.forEach((row) => {
    const year = parseInt(row["Year"]);
    const month = months.findIndex(m => m === String(row["Month"]).trim());

    const cost =
      (parseFloat(row["Elec Cost"]) || 0) +
      (parseFloat(row["Gas Cost"]) || 0) +
      (parseFloat(row["Water Cost"]) || 0);

    if (month <= selectedMonthIndex) {
      if (year === selectedYear) {
        total2025 += cost;
      } else if (year === selectedYear - 1) {
        total2024 += cost;
      }
    }
  });

  const diff = total2025 - total2024;
  const percent = total2024 > 0 ? ((diff / total2024) * 100).toFixed(1) : null;

  setCostValue({
    percent,
    value: diff,
    isPositive: diff < 0
  });
}, [costCsvData, selectedMonth, selectedYear]);




useEffect(() => {
  if (!costCsvData.length || !selectedYear || !selectedMonth) return;

  const currentMonthRow = costCsvData.find(
    (row) =>
      Number(row.Year) === Number(selectedYear) &&
      row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  const previousMonthRow = costCsvData.find(
    (row) =>
      Number(row.Year) === Number(selectedYear - 1) &&
      row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  if (currentMonthRow && previousMonthRow) {
    const curr =
      (parseFloat(currentMonthRow["Elec Cost"]) || 0) +
      (parseFloat(currentMonthRow["Gas Cost"]) || 0) +
      (parseFloat(currentMonthRow["Water Cost"]) || 0);

    const prev =
      (parseFloat(previousMonthRow["Elec Cost"]) || 0) +
      (parseFloat(previousMonthRow["Gas Cost"]) || 0) +
      (parseFloat(previousMonthRow["Water Cost"]) || 0);

    if (prev > 0) {
      const percentChange = ((curr - prev) / prev) * 100;
      setCostMonthCompare({
        percent: `${Math.abs(percentChange).toFixed(1)}%`,
        isPositive: percentChange < 0,
      });
    } else {
      setCostMonthCompare(null);
    }
  } else {
    setCostMonthCompare(null);
  }
}, [costCsvData, selectedMonth, selectedYear]);








  const macauData = [
    {
      label: "ISO",
      value: isoSaving.percent,
      unit: "",
      diff: "-13.0%",
      icon: 'iso',
      isPositive: parseFloat(isoSaving.percent) > 0,
      gj: isoSaving.gj,
     
    },
{
  label: "EUI",
  value: euiValue ? `${euiValue} kWh/m²` : 'N/A', // ✅ Include unit in value
  unit: "", // ✅ Empty unit since it's now in value
  diff: euiDiff,
  icon: 'eui',
  isPositive: euiIsPositive,
  subTitle: "Target EUI for 2025",
},
{
  label: "Electricity",
  value: electricityValue.percent !== null ? `${electricityValue.percent}%` : 'N/A',
  unit: "",
  diff: electricityChangeYoY?.percent ?? 'N/A',
  icon: "electricity",
  isPositive: electricityValue.isPositive ?? false,
  // ✅ Show this in the left-bottom like 45,240 kWh
  gj: `${Math.abs(electricityValue.difference || 0).toLocaleString()} kWh`,
},



{
  label: "Gas",
  value: gasChangeYoY?.percent ? `${gasChangeYoY.percent}%` : 'N/A',
  unit: "",
  diff: gasMonthCompare?.percent ?? 'N/A',
  icon: 'gas',
  isPositive: gasMonthCompare?.isPositive ?? false,
  gj: gasChangeYoY?.value != null
  ? `${gasChangeYoY.value.toFixed(0).toLocaleString()} m³`
  : ''

},


{
  label: "Water",
  value: waterValue.percent !== null ? `${waterValue.percent}%` : 'N/A',
  unit: "",
  diff: waterMonthCompare?.percent ?? 'N/A',
  icon: "water",
  isPositive: waterMonthCompare?.isPositive ?? false,
  gj: `${Math.abs(waterValue.value || 0).toLocaleString()} m³`,
},
   {
  label: "Cost",
  value: costValue.percent !== null ? `${costValue.percent}%` : 'N/A',
  unit: "",
  diff: costMonthCompare?.percent ?? 'N/A',
  icon: "cost",
  isPositive: costMonthCompare?.isPositive ?? false,
  gj: `${Math.abs(costValue.value || 0).toLocaleString()} MOP`
} ];

  return (
 <Box sx={{ p: 2, background: '#f8f9fa', minHeight: '100vh', marginLeft: isMobile ? 0 : 10 }}>
      
      {/* Filter Header */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 600 }}>Reporting</Typography>

        <FormControl size="small">
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            label="Month"
          >
            {months.map(month => <MenuItem key={month} value={month}>{month}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value)}
            label="Year"
            disabled={availableYears.length === 0}
          >
            {availableYears.length === 0 ? (
              <MenuItem value="">Loading...</MenuItem>
            ) : (
              availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      {/* Main 3-Column Grid Layout */}
      <Grid container spacing={3} bgcolor="#f9f9f9">
        {/* Macau Block */}
        <Grid item xs={12} md={4} >
          <DataColumn
            title="Macau"
            data={macauData}
            euiChange={euiChange}
            electricityChangeYoY={electricityChangeYoY}
            gasMonthCompare={gasMonthCompare}
            waterMonthCompare={waterMonthCompare}
            costMonthCompare={costMonthCompare}
          />
        </Grid>

         {/* Cotai Block */}
        <Grid item xs={12} md={4}>
          <CotaiComponent
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        </Grid>

        {/* Useful Info Block (coming soon) */}
         <Grid item xs={12} md={4}>
          <UsefulInfo selectedMonth={selectedMonth} selectedYear={selectedYear} />

         </Grid> 
      </Grid>
    </Box>
  );
};