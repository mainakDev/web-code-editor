import React from 'react';

export default function SettingsModal({ isOpen, onClose, settings, setSettings }) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      // Convert value to number if it's a range or select input, otherwise use checkbox boolean
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Editor Settings</h2>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={settingRowStyle}>
          <label>Font Size ({settings.fontSize}px)</label>
          <input 
            type="range" name="fontSize" min="10" max="24" 
            value={settings.fontSize} onChange={handleChange} 
          />
        </div>

        <div style={settingRowStyle}>
          <label>Tab Size</label>
          <select name="tabSize" value={settings.tabSize} onChange={handleChange} style={inputStyle}>
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        <div style={settingRowStyle}>
          <label>Enable Autocomplete</label>
          <input type="checkbox" name="autocomplete" checked={settings.autocomplete} onChange={handleChange} />
        </div>

        <div style={settingRowStyle}>
          <label>Show Line Numbers</label>
          <input type="checkbox" name="lineNumbers" checked={settings.lineNumbers} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}

// --- Inline Styles for the Modal ---
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000,
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const modalStyle = {
  backgroundColor: '#252526', padding: '20px', borderRadius: '8px',
  width: '350px', border: '1px solid #444', color: '#ccc',
  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
};

const closeBtnStyle = {
  background: 'none', border: 'none', color: '#ccc', fontSize: '24px', cursor: 'pointer'
};

const settingRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
  marginBottom: '15px', fontSize: '14px'
};

const inputStyle = {
  backgroundColor: '#3c3c3c', color: '#fff', border: '1px solid #555', 
  padding: '4px 8px', borderRadius: '4px'
};