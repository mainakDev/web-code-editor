import React, { useState } from 'react';

export default function Sidebar({ files, activeFileId, handleOpenFile, handleCreateFile, handleCreateFolder, handleDeleteFileFromSystem }) {
  // Track which folders are toggled open
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (id, e) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // RECURSIVE FUNCTION: Renders folders and files layer by layer
  const renderTree = (parentId = null, level = 0) => {
    const nodes = files.filter(f => f.parentId === parentId);
    
    // Sort: Folders at the top, files at the bottom, alphabetically
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
            style={{ paddingLeft: `${15 + level * 15}px` }} // Indent based on depth level
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
          {/* If it's an open folder, render its children right below it */}
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
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => handleCreateFile(null)} className="new-file-btn" title="New File at Root">📄+</button>
            <button onClick={() => handleCreateFolder(null)} className="new-file-btn" title="New Folder at Root">📁+</button>
          </div>
        </div>

        <ul className="file-list" style={{ flex: 1, overflowY: 'auto' }}>
          {renderTree(null)}
        </ul>

      </div>
    </div>
  );
}