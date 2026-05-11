



// src/config/userRoles.js
// This file defines user roles, assigned sites, allowed pages, and permissions

export const USER_ROLES = {
  'mgm_cotai_mbcx_user1': {
    site: 'Cotai',
    allowedPages: [
      '/Home',
      '/Utility',
      '/CarbonEmissionsDashboard',
      '/HeatMap',
      '/HeatMap/detail',
      '/HeatMap/cotai',
      '/WineCellur',
      '/plant',
      '/LibraryPage',
      '/SensorMonitoring',
      '/Skyspark',
      '/mgm',
      '/MFMCustomer'  // ✨ ADDED
    ],
    lockSite: true,
    role: 'FULL_ACCESS_COTAI',
    redirectTo: '/Home'
  },

  'mgmfm': {
    site: 'Macau',
    allowedPages: [
      '/Home',
      '/Utility',
      '/CarbonEmissionsDashboard',
      '/HeatMap',
      '/HeatMap/detail',
      '/WineCellur',
      '/plant',
      '/LibraryPage',
      '/SensorMonitoring',
      '/Skyspark',
      '/mgm',
      '/MFMCustomer'  // ✨ ADDED
    ],
    lockSite: true,
    role: 'FULL_ACCESS_MACAU',
    redirectTo: '/Home'
  },

  'MGM_COTAI_FO': {
    site: 'Cotai',
    allowedPages: [
      '/HeatMap/cotai',
      '/MFMCustomer'  // ✨ ADDED - WAS MISSING
    ],
    lockSite: true,
    role: 'HEATMAP_ONLY_COTAI',
    redirectTo: '/HeatMap/cotai'
  },

  'MGM_MACAU_FO': {
    site: 'Macau',
    allowedPages: [
      '/HeatMap/detail',
      '/MFMCustomer'  // ✨ ADDED - WAS MISSING
    ],
    lockSite: true,
    role: 'HEATMAP_ONLY_MACAU',
    redirectTo: '/HeatMap/detail?floor=L1'
  }
};

export const DEFAULT_ROLE = {
  site: null,
  allowedPages: [
    '/Home',
    '/Utility',
    '/CarbonEmissionsDashboard',
    '/HeatMap',
    '/HeatMap/detail',
    '/HeatMap/cotai',
    '/WineCellur',
    '/plant',
    '/LibraryPage',
    '/SensorMonitoring',
    '/utility',
    '/energy',
    '/gas',
    '/water',
    '/Skyspark',
    '/admin/csv-manager',
    '/mgm',
    '/MFMCustomer'  // ✨ CORRECT CASE
  ],
  lockSite: false,
  role: 'DEFAULT',
  redirectTo: '/Home'
};

// Helper function to get user role
export const getUserRole = (username) => {
  return USER_ROLES[username] || DEFAULT_ROLE;
};

// Helper function to check if user can access a page
export const canAccessPage = (username, pathname) => {
  const role = getUserRole(username);

  // Check exact path match first
  if (role.allowedPages.includes(pathname)) {
    return true;
  }

  // Check if pathname starts with any allowed page
  return role.allowedPages.some(page => pathname.startsWith(page));
};

// Helper function to get sidebar items for user
export const getSidebarItemsForUser = (username) => {
  const role = getUserRole(username);

  const allMenuItems = [
    { icon: 'Home', alt: 'Home', path: '/Home' },
    { icon: 'Utility', alt: 'Utility', path: '/Utility' },
    { icon: 'Co2', alt: 'Co2', path: '/CarbonEmissionsDashboard' },
    { icon: 'HeatMap', alt: 'Heatmap', path: '/HeatMap' },
    { icon: 'Performance', alt: 'Plant', path: '/plant' },
    { icon: 'solar2_white', alt: 'Sun Path', path: '/mgm' },
    { icon: 'Folder', alt: 'Folder', path: '/LibraryPage' },
    { icon: 'Alarm', alt: 'Alarm', path: '/SensorMonitoring' },
    { icon: 'WineCellar', alt: 'WineCellur', path: '/WineCellur' },
    { icon: 'Skyspark', alt: 'Skyspark', path: '/Skyspark' },
     { icon: 'Customer', alt: "customer", path: "/MFMCustomer" },
  ];

  return allMenuItems.filter(item => {
    return role.allowedPages.some(page => page.includes(item.path));
  });
};