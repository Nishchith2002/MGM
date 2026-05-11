import React from 'react';
import { Grid, Typography, Box, Avatar, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

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

const ImageMap = { iso, eui, electricity, gas, water, cost, cdd, oat, food, occupancy, chiller };

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
  <Grid item xs={12} md={6}>
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
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MetricImage icon={icon} />
          <Box ml={6}>
            <Typography variant="caption" sx={{ fontSize: "9px", color: '#555' }}>
              {{
                Cost: 'YTD total utility cost saving compared to last year',
                ISO: 'Target: 13% by 2025 Baseline: CY 2019',
                EUI: 'YTD actual electricity utilization intensity',
                Electricity: 'YTD actual electricity saving compared to last year',
                Gas: 'YTD actual gas saving compared to last year',
                Water: 'YTD actual water saving compared to last year'
              }[label]}
            </Typography>

            <Box display="flex" alignItems="center" gap="4px">
              <Typography variant="h6" sx={{ color: '#000', fontWeight: 700 }}>{value}</Typography>
              <Typography variant="h5" sx={{ color: isPositive ? 'green' : 'red', fontWeight: 700 }}>
                {isPositive ? '▼' : '▲'}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: label === 'Cost' ? 600 : 300 }}>{gj}</Typography>

            {label === 'EUI' && (
              <Typography variant="caption" color="text.secondary">
                Compare to same month Last Yr:
                <span style={{ color: euiChange < 0 ? 'green' : 'red', marginLeft: 4 }}>
                  {Math.abs(euiChange)}% {euiChange < 0 ? '▼' : '▲'}
                </span>
              </Typography>
            )}

            {label === 'Electricity' && electricityChangeYoY && (
              <Typography variant="caption" color="text.secondary">
                Compare to same month Last Yr:
                <span style={{ color: electricityChangeYoY.isPositive ? 'green' : 'red', marginLeft: 4 }}>
                  {electricityChangeYoY.percent} {electricityChangeYoY.isPositive ? '▼' : '▲'}
                </span>
              </Typography>
            )}

            {label === 'Gas' && gasMonthCompare && (
              <Typography variant="caption" color="text.secondary">
                Compare to same month Last Yr:
                <span style={{ color: gasMonthCompare.isPositive ? 'green' : 'red', marginLeft: 4 }}>
                  {gasMonthCompare.percent} {gasMonthCompare.isPositive ? '▼' : '▲'}
                </span>
              </Typography>
            )}

            {label === 'Water' && waterMonthCompare && (
              <Typography variant="caption" color="text.secondary">
                Compare to same month Last Yr:
                <span style={{ color: waterMonthCompare.isPositive ? 'green' : 'red', marginLeft: 4 }}>
                  {waterMonthCompare.percent} {waterMonthCompare.isPositive ? '▼' : '▲'}
                </span>
              </Typography>
            )}

            {label === 'Cost' && costMonthCompare && (
              <Typography variant="caption" color="text.secondary">
                Compare to same month Last Yr:
                <span style={{ color: costMonthCompare.isPositive ? 'green' : 'red', marginLeft: 4 }}>
                  {costMonthCompare.percent} {costMonthCompare.isPositive ? '▼' : '▲'}
                </span>
              </Typography>
            )}
          </Box>
        </Box>

        {label === 'ISO' && (
          <Box sx={{ textAlign: 'right', alignSelf: 'flex-start' }}>
            <Typography variant="caption" color="#000">Projected saving<br />by 2025</Typography>
            <Typography variant="body2" fontWeight={500}>-13.0%</Typography>
          </Box>
        )}
      </MetricCard>
    ))}
  </Grid>
);

export default DataColumn;
