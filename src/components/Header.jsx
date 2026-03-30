import React from 'react';

export default function Header({ toggleSidebar, handleDownloadProject, openSettings }) {
  return (
    <div className="app-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      
      {/* Left Side: Hamburger & Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="logo">Web Editor</div>
      </div>
  
      {/* Right Side: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '15px' }}>
        
        {/* Settings Gear Button */}
        <button 
          onClick={openSettings}
          style={{
            background: 'transparent',
            color: '#ccc',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0'
          }}
          title="Editor Settings"
        >
          ⚙️
        </button>

        {/* Download Button */}
        <button 
          onClick={handleDownloadProject}
          style={{
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download ZIP
        </button>
      </div>

    </div>
  );
}