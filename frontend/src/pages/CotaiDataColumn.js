



import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  Box, Grid, Typography, Paper, Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Image imports
import iso from '../assets/icons/iso.png';
import eui from '../assets/icons/energyLgHovered.png';
import electricity from '../assets/icons/energyDG.png';
import gas from '../assets/icons/gasHovered.png';
import water from '../assets/icons/waterHovered.png';
import cost from '../assets/icons/gear.png';

const ImageMap = { iso, eui, electricity, gas, water, cost };

const MetricCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  marginBottom: '10px',
  borderRadius: 8,
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
}));

const MetricImage = ({ icon }) => {
  const size = ['iso', 'eui', 'electricity', 'gas', 'water', 'cost'].includes(icon) ? 88 : 64;

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

const DataColumn = ({ title, data, euiChange, electricityChangeYoY, gasMonthCompare, waterMonthCompare, costMonthCompare }) => (
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

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MetricImage icon={icon} />
          <Box ml={6}>
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
                {value}{unit}
              </Typography>
              {isPositive !== null && (
                <Typography
                  variant="h5"
                  sx={{ color: isPositive ? 'green' : 'red', fontWeight: 700 }}
                >
                  {isPositive ? '▼' : '▲'}
                </Typography>
              )}
            </Box>

            <Typography variant="body2" sx={{ fontWeight: label === 'Cost' ? 600 : 300 }}>
              {gj}
            </Typography>
          </Box>
        </Box>

        {/* Right side comparisons */}
        {label === 'ISO' && (
          <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
            <Typography variant="caption" color="#000">Projected saving<br />by 2025</Typography>
            <Typography variant="body2" fontWeight={500}>-13.0%</Typography>
          </Box>
        )}

        {label === 'EUI' && (
          <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
            <Typography variant="caption" color="text.secondary">Compare to same<br />month Last Yr<br /></Typography>
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
              {electricityChangeYoY.percent} <span>{electricityChangeYoY.isPositive ? '▼' : '▲'}</span>
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
              {waterMonthCompare.percent} <span>{waterMonthCompare.isPositive ? '▼' : '▲'}</span>
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
              {costMonthCompare.percent} <span>{costMonthCompare.isPositive ? '▼' : '▲'}</span>
            </Typography>
          </Box>
        )}
      </MetricCard>
    ))}
  </Grid>
);

const CotaiComponent = ({ selectedYear, selectedMonth }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [csvData, setCsvData] = useState([]);
  const [costCsvData, setCostCsvData] = useState([]);
  const [isoSaving, setIsoSaving] = useState({ percent: 'N/A', gj: 'N/A' });
  const [euiValue, setEuiValue] = useState(null);
  const [euiChange, setEuiChange] = useState(null);
  const [euiIsPositive, setEuiIsPositive] = useState(false);
  const [electricityValue, setElectricityValue] = useState({});
  const [electricityChangeYoY, setElectricityChangeYoY] = useState(null);
  const [gasMonthCompare, setGasMonthCompare] = useState(null);
  const [gasChangeYoY, setGasChangeYoY] = useState(null);
  const [waterMonthCompare, setWaterMonthCompare] = useState(null);
  const [waterValue, setWaterValue] = useState({});
  const [costMonthCompare, setCostMonthCompare] = useState(null);
  const [costValue, setCostValue] = useState({});

  const area = 211545;

  // Load CSV data
  useEffect(() => {
    const loadCsvData = (url, setter) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const cleaned = results.data.map((row) => {
            const r = {};
            Object.entries(row).forEach(([k, v]) => {
              r[k.trim()] = typeof v === 'string' ? v.trim() : v;
            });
            return r;
          });
          setter(cleaned);
        }
      });
    };

    loadCsvData("/Data/executiveSummary/Cotai_Cleaned_Full.csv", setCsvData);
    loadCsvData("/Data/executiveSummary/Cotai_Cost_Corrected_Full.csv", setCostCsvData);
  }, []);

  useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  // YTD rows till selected month
  const ytdRows = csvData.filter(row =>
    Number(row.Year) === Number(selectedYear) &&
    months.findIndex(m => m === String(row.Month).trim()) <= selectedMonthIndex
  );

  const totalActual = ytdRows.reduce(
    (sum, row) => sum + parseFloat(row['Total Actual Energy Consumption'] || 0),
    0
  );
  const totalNormalized = ytdRows.reduce(
    (sum, row) => sum + parseFloat(row['Total Normalized Energy Consumption'] || 0),
    0
  );

  if (!isNaN(totalActual) && totalNormalized > 0) {
    const diff = totalActual - totalNormalized;
    const percent = (diff / totalNormalized) * 100;

    setIsoSaving({
      percent: `${percent.toFixed(1)}%`,
      gj: `${Math.abs(diff.toFixed(0)).toLocaleString()} GJ`,
    });
  } else {
    setIsoSaving({ percent: "N/A", gj: "N/A" });
  }
}, [csvData, selectedYear, selectedMonth]);


  // Calculate electricity and EUI values
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

  // ✅ Filter only months <= selected month for YTD
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

  const euiYTD = totalCurrent / area;
  const diff = totalCurrent - totalPrevious;
  const change = totalPrevious !== 0 ? (diff / totalPrevious) * 100 : null;

  setEuiValue(euiYTD.toFixed(1));

  setElectricityValue({
    value: euiYTD.toFixed(1),
    percent: change !== null ? change.toFixed(1) : 'N/A',
    isPositive: diff < 0,
    difference: diff,
    compareLastYear: change,
  });

  // ✅ Same-month (February only) EUI comparison
  const currentMonthRow = csvData.find(
    (row) => Number(row.Year) === Number(selectedYear) &&
             row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );
  const previousMonthRow = csvData.find(
    (row) => Number(row.Year) === Number(selectedYear - 1) &&
             row.Month?.toString().trim().toLowerCase() === selectedMonth.toLowerCase()
  );

  if (currentMonthRow && previousMonthRow) {
    const currKWh = parseFloat(currentMonthRow["Actual Electricity Consumption"]);
    const prevKWh = parseFloat(previousMonthRow["Actual Electricity Consumption"]);

    const euiCurr = currKWh / area;
    const euiPrev = prevKWh / area;

    if (!isNaN(euiCurr) && !isNaN(euiPrev) && euiPrev !== 0) {
      const euiDiff = euiCurr - euiPrev;
      const percentChange = (euiDiff / euiPrev) * 100;

      setEuiChange(percentChange.toFixed(1));
      setEuiIsPositive(percentChange < 0);

      setElectricityChangeYoY({
        value: euiDiff,
        percent: `${Math.abs(percentChange).toFixed(1)}%`,
        isPositive: percentChange < 0,
      });

      console.log("✅ February EUI comparison:");
      console.log("Feb", selectedYear, "kWh:", currKWh, "| EUI:", euiCurr.toFixed(1));
      console.log("Feb", selectedYear - 1, "kWh:", prevKWh, "| EUI:", euiPrev.toFixed(1));
      console.log("Compare %:", percentChange.toFixed(1));
    } else {
      setEuiChange(null);
      setEuiIsPositive(false);
      setElectricityChangeYoY(null);
    }
  } else {
    setEuiChange(null);
    setEuiIsPositive(false);
    setElectricityChangeYoY(null);
  }
}, [csvData, selectedYear, selectedMonth]);




  // Calculate gas values
 useEffect(() => {
  if (!csvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  // YTD Gas calculation
  let totalCurrent = 0;
  let totalPrevious = 0;

  csvData.forEach((row) => {
    const year = parseInt(row["Year"]);
    const month = months.findIndex(m => m === String(row["Month"]).trim());
    const gas = parseFloat(row["Actual Natural Gas Consumption"]) || 0;

    if (month <= selectedMonthIndex) {
      if (year === selectedYear) {
        totalCurrent += gas;
      } else if (year === selectedYear - 1) {
        totalPrevious += gas;
      }
    }
  });

  const diff = totalCurrent - totalPrevious;
  const percent = totalPrevious > 0 ? ((diff / totalPrevious) * 100).toFixed(1) : null;

  setGasChangeYoY({
    percent,
    value: diff.toFixed(1),
    isPositive: diff < 0
  });

  // Same month comparison
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
    const curr = parseFloat(currentMonthRow["Actual Natural Gas Consumption"]) || 0;
    const prev = parseFloat(previousMonthRow["Actual Natural Gas Consumption"]) || 0;

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


  // Calculate water values
  useEffect(() => {
    if (!csvData.length || !selectedYear || !selectedMonth) return;

    const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

    // YTD Water calculation
    let totalCurrent = 0;
    let totalPrevious = 0;

    csvData.forEach((row) => {
      const year = parseInt(row["Year"]);
      const month = months.findIndex(m => m === String(row["Month"]).trim());
      const water = parseFloat(row["Actual Water Consumption"]) || 0;

      if (month <= selectedMonthIndex) {
        if (year === selectedYear) {
          totalCurrent += water;
        } else if (year === selectedYear - 1) {
          totalPrevious += water;
        }
      }
    });

    const diff = totalCurrent - totalPrevious;
    const percent = totalPrevious > 0 ? ((diff / totalPrevious) * 100).toFixed(1) : null;

    setWaterValue({
      percent,
      value: diff,
      isPositive: diff < 0
    });

    // Same month comparison
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

  // Calculate cost values
useEffect(() => {
  if (!costCsvData.length || !selectedYear || !selectedMonth) return;

  const selectedMonthIndex = months.findIndex(m => m === selectedMonth);

  let totalCurrent = 0;
  let totalPrevious = 0;

  costCsvData.forEach(row => {
    const year = parseInt(row["Year"]);
    const month = months.findIndex(m => m === String(row["Month"]).trim());

    const elec = parseFloat(row["Elec Cost"]) || 0;
    const gas = parseFloat(row["Gas Cost"]) || 0;
    const water = parseFloat(row["Water Cost"]) || 0;
    const cost = elec + gas + water;

    if (month <= selectedMonthIndex) {
      if (year === selectedYear) {
        totalCurrent += cost;
      } else if (year === selectedYear - 1) {
        totalPrevious += cost;
      }
    }
  });

  const diff = totalCurrent - totalPrevious;
  const percent = totalPrevious > 0 ? ((diff / totalPrevious) * 100).toFixed(1) : null;

  setCostValue({
    percent,
    value: diff.toFixed(0),
    isPositive: diff < 0,
  });

  // === SAME MONTH COMPARISON ===
  let currCost = 0, prevCost = 0;

  costCsvData.forEach(row => {
    const year = parseInt(row["Year"]);
    const month = String(row["Month"]).trim().toLowerCase();

    if (month === selectedMonth.toLowerCase()) {
      const elec = parseFloat(row["Elec Cost"]) || 0;
      const gas = parseFloat(row["Gas Cost"]) || 0;
      const water = parseFloat(row["Water Cost"]) || 0;
      const cost = elec + gas + water;

      if (year === selectedYear) {
        currCost += cost;
      } else if (year === selectedYear - 1) {
        prevCost += cost;
      }
    }
  });

  if (prevCost > 0) {
    const percentChange = ((currCost - prevCost) / prevCost) * 100;
    setCostMonthCompare({
      percent: `${Math.abs(percentChange).toFixed(1)}%`,
      isPositive: percentChange < 0,
    });
  } else {
    setCostMonthCompare(null);
  }

}, [costCsvData, selectedMonth, selectedYear]);


  const cotaiData = [
    {
      label: "ISO",
      value: isoSaving?.percent || "N/A",
      unit: "",
      diff: null,
      icon: "iso",
      isPositive:
        isoSaving?.percent !== "N/A" && !isNaN(parseFloat(isoSaving.percent))
          ? parseFloat(isoSaving.percent) < 0
          : null,
      gj: isoSaving?.gj || "N/A",
    },
    {
      label: "EUI",
      value: euiValue ?? 'N/A',
      unit: " kWh/m²",
      diff: euiChange ?? 'N/A',
      icon: 'eui',
      isPositive: euiIsPositive
    },
    {
      label: "Electricity",
      value: electricityValue.percent ? `${electricityValue.percent}%` : 'N/A',
      unit: "",
      diff: electricityChangeYoY?.percent ?? 'N/A',
      icon: 'electricity',
      isPositive: electricityValue.isPositive,
      gj: `${Math.abs(electricityValue.difference || 0).toLocaleString()} kWh`
    },
    {
      label: "Gas",
      value: gasChangeYoY?.percent ? `${gasChangeYoY.percent}%` : 'N/A',
      unit: "",
      diff: gasMonthCompare?.percent ?? 'N/A',
      icon: 'gas',
      isPositive: gasChangeYoY?.isPositive,
      gj: `${Math.abs(gasChangeYoY?.value || 0).toLocaleString()} m³`
    },
    {
      label: "Water",
      value: waterValue?.percent ? `${waterValue.percent}%` : 'N/A',
      unit: "",
      diff: waterMonthCompare?.percent ?? 'N/A',
      icon: 'water',
      isPositive: waterValue?.isPositive,
      gj: `${Math.abs(waterValue.value || 0).toLocaleString()} m³`
    },
    {
      label: "Cost",
      value: costValue?.percent ? `${costValue.percent}%` : 'N/A',
      unit: "",
      diff: costMonthCompare?.percent ?? 'N/A',
      icon: 'cost',
      isPositive: costValue?.isPositive,
      gj: `${Math.abs(costValue.value || 0).toLocaleString()} MOP`
    }
  ];

  return (
    <DataColumn
      title="Cotai"
      data={cotaiData}
      euiChange={euiChange}
      electricityChangeYoY={electricityChangeYoY}
      gasMonthCompare={gasMonthCompare}
      waterMonthCompare={waterMonthCompare}
      costMonthCompare={costMonthCompare}
    />
  );
};

export default CotaiComponent;