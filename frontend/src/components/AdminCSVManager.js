


import React, { useState, useEffect } from 'react';
import { Upload, Download } from 'lucide-react';

const FileRow = ({ category, filename, fileData, textAreaData, onTextAreaChange, onUpload, onDownload, loading }) => (
  <div style={{ display: 'flex', marginBottom: '25px', alignItems: 'flex-start' }}>
    <div style={{ flex: 1, marginRight: '15px' }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Arial, sans-serif' }}>
        {category}
      </div>
      <textarea
        value={textAreaData[filename] || ''}
        onChange={(e) => onTextAreaChange(filename, e.target.value)}
        placeholder={`Paste ${filename} data here...`}
        style={{
          width: '100%', height: '120px', border: '2px solid #000',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '11px', padding: '8px', resize: 'none',
          backgroundColor: '#fff', outline: 'none', lineHeight: '1.3', boxSizing: 'border-box'
        }}
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '140px', marginTop: '20px' }}>
      <button
        onClick={() => onUpload(filename)}
        disabled={loading[filename]}
        style={{
          padding: '10px 15px', border: '2px solid #000', backgroundColor: '#fff',
          cursor: loading[filename] ? 'not-allowed' : 'pointer', fontSize: '12px',
          fontWeight: '500', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '6px', height: '40px', borderRadius: '0'
        }}
      >
        <Upload size={14} />
        {loading[filename] ? 'Uploading...' : 'Upload'}
      </button>

      <button
        onClick={() => onDownload(filename)}
        style={{
          padding: '10px 15px', border: '2px solid #000', backgroundColor: '#fff',
          cursor: 'pointer', fontSize: '12px', fontWeight: '500',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', height: '40px', borderRadius: '0'
        }}
      >
        <Download size={14} />
        Download File
      </button>

      {fileData[filename] && (
        <div style={{ fontSize: '10px', color: '#008000', textAlign: 'center', marginTop: '3px' }}>
          ✓ File loaded ({Math.max(fileData[filename].split('\n').length - 1, 0)} rows)
        </div>
      )}
    </div>
  </div>
);

const AdminCSVManager = () => {
  const [selectedSite, setSelectedSite] = useState('Macau');
  const [fileData, setFileData] = useState({});
  const [textAreaData, setTextAreaData] = useState({});
  const [loading, setLoading] = useState({});

  const fileStructure = {
    Macau: [
      { category: 'Consumption', files: ['Macho_Cleaned_Consumption.csv'] },
      { category: 'Cost', files: ['Macho_Cost_Corrected_Full.csv'] },
      { category: 'Consumption Profile (Elec)', files: ['Macau_Consumption.csv'] },
      { category: 'Consumption Profile (Water)', files: ['Macho_Water_Breakdown.csv'] },
      { category: 'Consumption Profile (Energy)', files: ['Macho_Energy_Breakdown.csv'] },
      { category: 'Consumption Profile (Gas)', files: ['Macho_Gas_Breakdown.csv'] },
      { category: 'Room Occupancy (BOTH SITES)', files: ['Room_Occupancy_Combined.csv'] }
    ],
    Cotai: [
      { category: 'Consumption', files: ['Cotai_Cleaned_Consumption.csv'] },
      { category: 'Cost', files: ['Cotai_Cost_Corrected_Full.csv'] },
      { category: 'Consumption Profile (Elec)', files: ['Cotai_Consumption.csv'] },
      { category: 'Consumption Profile (Water)', files: ['Cotai_Water_Breakdown.csv'] },
      { category: 'Consumption Profile (Energy)', files: ['Cotai_Energy_Breakdown.csv'] },
      { category: 'Consumption Profile (Gas)', files: ['Cotai_Gas_Breakdown.csv'] }
    ]
  };

  useEffect(() => { loadExistingFiles(); }, []);

  const loadExistingFiles = async () => {
    const allFiles = [
      ...fileStructure.Macau.flatMap(s => s.files),
      ...fileStructure.Cotai.flatMap(s => s.files)
    ];
    const loadedData = {};
    for (const filename of allFiles) {
      try {
        const res = await fetch(`${process.env.REACT_APP_BE_URL}/api/file/${filename}?t=${Date.now()}`);
        if (res.ok) loadedData[filename] = await res.text();
      } catch (e) { /* ignore missing */ }
    }
    setFileData(loadedData);
  };

  const handleTextAreaChange = (filename, value) =>
    setTextAreaData(prev => ({ ...prev, [filename]: value }));

  const handleUpload = async (filename) => {
    const content = textAreaData[filename] || '';
    if (!content.trim()) { alert('Please paste some data before uploading'); return; }
    setLoading(prev => ({ ...prev, [filename]: true }));
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URL}/api/file/upload/${filename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Upload failed');
      setFileData(prev => ({ ...prev, [filename]: content }));
      window.dispatchEvent(new CustomEvent('csvUpdated', { detail: { filename, content } }));
      setTextAreaData(prev => ({ ...prev, [filename]: '' }));
      alert(`${filename} updated successfully! The dashboard will now show the new data.`);
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please check your connection and try again.');
    } finally {
      setLoading(prev => ({ ...prev, [filename]: false }));
    }
  };

  const handleDownload = (filename) => {
    const content = fileData[filename] || '';
    if (!content) { alert('No data available for download'); return; }
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const sections = fileStructure[selectedSite] || [];

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f8f8',
      minHeight: '100vh', padding: '0', margin: '100px 0px 0px 100px'
    }}>
      {/* Site Selection Header */}
      <div style={{
        backgroundColor: '#e8e8e8', padding: '10px 20px',
        borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '15px'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Select Site:</span>
        {Object.keys(fileStructure).map(site => (
          <label key={site} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="radio" name="site" value={site}
              checked={selectedSite === site}
              onChange={(e) => setSelectedSite(e.target.value)}
            />
            <span style={{ fontWeight: selectedSite === site ? 'bold' : 'normal' }}>{site}</span>
          </label>
        ))}
      </div>

      {/* Site Label */}
      <div style={{
        padding: '15px 20px 10px 20px', fontSize: '14px', fontWeight: 'bold',
        color: selectedSite === 'Macau' ? '#d2691e' : '#8b4513'
      }}>
        {selectedSite}
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '30px', padding: '0 20px 100px 20px', maxWidth: '1400px'
      }}>
        <div>
          {sections.slice(0, Math.ceil(sections.length / 2)).map((section, i) =>
            section.files.map((filename, j) => (
              <FileRow
                key={`left-${i}-${j}`}
                category={section.category}
                filename={filename}
                fileData={fileData}
                textAreaData={textAreaData}
                onTextAreaChange={handleTextAreaChange}
                onUpload={handleUpload}
                onDownload={handleDownload}
                loading={loading}
              />
            ))
          )}
        </div>

        <div>
          {sections.slice(Math.ceil(sections.length / 2)).map((section, i) =>
            section.files.map((filename, j) => (
              <FileRow
                key={`right-${i}-${j}`}
                category={section.category}
                filename={filename}
                fileData={fileData}
                textAreaData={textAreaData}
                onTextAreaChange={handleTextAreaChange}
                onUpload={handleUpload}
                onDownload={handleDownload}
                loading={loading}
              />
            ))
          )}
        </div>
      </div>

      {/* Fixed Status Panel */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', width: '250px',
        backgroundColor: '#fff', border: '1px solid #000', padding: '10px',
        fontSize: '11px', boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Loaded Files:</div>
        {Object.keys(fileData).length > 0 ? (
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {Object.keys(fileData).map(fn => (
              <div key={fn} style={{ color: '#008000', fontSize: '10px', marginBottom: '2px' }}>
                ✓ {fn}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: '10px' }}>Loading files...</div>
        )}
      </div>
    </div>
  );
};

export default AdminCSVManager;