import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';

export default function EditorPanel({ files, openFileIds, activeFile, activeFileId, setActiveFileId, handleCloseTab, handleEditorChange, settings }) {
  
  const getLanguageExtension = (lang) => {
    switch (lang) {
      case 'html': return [html()];
      case 'css': return [css()];
      case 'javascript': return [javascript({ jsx: true })];
      default: return [];
    }
  };

  // Safe fallback just in case settings hasn't loaded yet
  const safeSettings = settings || { fontSize: 14, tabSize: 2, autocomplete: true, lineNumbers: true };

  return (
    <div className="editor-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Tab Bar */}
      <div className="tabs file-tabs">
        {openFileIds.map(id => {
          const file = files.find(f => f.id === id);
          if (!file) return null;
          return (
            <div 
              key={`tab-${file.id}`}
              onClick={() => setActiveFileId(file.id)}
              className={`tab ${activeFileId === file.id ? 'active' : ''}`}
            >
              <span>{file.name}</span>
              <button onClick={(e) => handleCloseTab(e, file.id)} className="close-tab-btn">×</button>
            </div>
          );
        })}
      </div>
      
      {/* Editor / Image Viewer Area */}
      <div className="code-editor" style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e1e' }}>
        {activeFile ? (
          // --- NEW: Check if the file is an image ---
          activeFile.isImage ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
              <img 
                src={activeFile.content} 
                alt={activeFile.name} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', 
                         backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgfQMQgAAMQAAI3MDHw8DBABHACMAZGAwwjRMAIo2FEGA0jHAgAAN4pBwI1XhG0AAAAAElFTkSuQmCC")' // Adds a checkerboard background for transparent PNGs/SVGs
                      }} 
              />
            </div>
          ) : (
            // --- Normal Text Editor ---
            <CodeMirror
              value={activeFile.content}
              theme="dark"
              extensions={getLanguageExtension(activeFile.language)}
              onChange={handleEditorChange}
              style={{ fontSize: `${safeSettings.fontSize}px`, height: '100%' }} 
              basicSetup={{
                autocompletion: safeSettings.autocomplete,
                lineNumbers: safeSettings.lineNumbers,
                tabSize: safeSettings.tabSize
              }}
            />
          )
        ) : (
          <div className="empty-editor-state" style={{ textAlign: 'center', flexDirection: 'column', display: 'flex', justifyContent: 'center', height: '100%' }}>
            <h2 style={{ marginBottom: '10px' }}>Welcome to the Web Editor!</h2>
            <p style={{ margin: 0 }}>Click the 📄+ or 📁+ buttons <br /> in the Explorer to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}