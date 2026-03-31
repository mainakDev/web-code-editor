import React, { useState, useRef, useEffect } from 'react';

export default function Sidebar({ files, activeFileId, handleOpenFile, handleCreateFile, handleCreateFolder, handleDeleteFileFromSystem, handleImport }) {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  
  // --- NEW: Ref to track the dropdown container ---
  const dropdownRef = useRef(null);

  // --- NEW: Click Outside Listener ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the menu is open, AND the click was NOT inside the dropdown container, close it
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUploadMenuOpen(false);
      }
    };

    // Attach the listener to the whole document
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Clean up the listener when the component unmounts
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFolder = (id, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (parentId = null, level = 0) => {
    const nodes = files.filter(f => f.parentId === parentId);
    
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });

    return nodes.map(node => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders[node.id];

      return (
        <React.Fragment key={node.id}>
          <li 
            onClick={(e) => isFolder ? toggleFolder(node.id, e) : handleOpenFile(node.id)}
            className={`tree-node ${activeFileId === node.id ? 'active' : ''}`}
            style={{ paddingLeft: `${15 + level * 15}px` }}
          >
            <div className="node-label">
              <span className="node-icon">{isFolder ? (isExpanded ? '📂' : '📁') : '📄'}</span>
              <span className="node-name">{node.name}</span>
            </div>
            
            <div className="sidebar-actions">
              {isFolder && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleCreateFile(node.id); }} className="action-btn" title="New File Here">📄+</button>
                  <button onClick={(e) => { e.stopPropagation(); handleCreateFolder(node.id); }} className="action-btn" title="New Folder Here">📁+</button>
                </>
              )}
              <button onClick={(e) => handleDeleteFileFromSystem(e, node.id)} className="delete-btn" title="Delete">🗑</button>
            </div>
          </li>
          {isFolder && isExpanded && renderTree(node.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div style={{ width: '250px', flexShrink: 0, height: '100%' }} className="sidebar-panel">
      <div className="sidebar" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        <div className="sidebar-header">
          <h2>Explorer</h2>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button onClick={() => handleCreateFile(null)} className="new-file-btn" title="New File">📄+</button>
            <button onClick={() => handleCreateFolder(null)} className="new-file-btn" title="New Folder">📁+</button>
            
            <div style={{ width: '1px', height: '14px', backgroundColor: '#444', margin: '0 2px' }}></div>
            
            {/* --- UPDATED COMBINED DROPDOWN MENU --- */}
            {/* We attached the dropdownRef here and removed onMouseLeave */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)} 
                className={`new-file-btn ${isUploadMenuOpen ? 'active' : ''}`} 
                title="Import"
              >
                📤
              </button>

              {isUploadMenuOpen && (
                <div className="upload-dropdown">
                  <button onClick={() => { fileInputRef.current.click(); setIsUploadMenuOpen(false); }}>
                    📄 Upload Files
                  </button>
                  <button onClick={() => { folderInputRef.current.click(); setIsUploadMenuOpen(false); }}>
                    📂 Upload Folder
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* --- HIDDEN INPUTS --- */}
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleImport} />
        <input type="file" ref={folderInputRef} style={{ display: 'none' }} webkitdirectory="true" directory="true" onChange={handleImport} />

        <ul className="file-list" style={{ flex: 1, overflowY: 'auto' }}>
          {renderTree(null)}
        </ul>

      </div>
    </div>
  );
}