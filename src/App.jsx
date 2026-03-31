import { useState, useCallback, useEffect, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import EditorPanel from './components/EditorPanel';
import ToolsPanel from './components/ToolsPanel';
import SettingsModal from './components/SettingsModal'; // <-- Added Import
import '@xterm/xterm/css/xterm.css';
import './App.css';

const initialFiles = [];

function App() {
  const [files, setFiles] = useState(initialFiles);
  const [openFileIds, setOpenFileIds] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeToolTab, setActiveToolTab] = useState('preview'); 
  const [srcDoc, setSrcDoc] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // --- NEW SETTINGS STATE ---
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 14,
    tabSize: 2,
    autocomplete: true,
    lineNumbers: true
  });
  
  const fitAddonRef = useRef(null); 
  const xtermInstance = useRef(null);
  
  const activeFile = files.find(file => file.id === activeFileId);

  // --- TERMINAL & OUTPUT LOGIC ---
  useEffect(() => {
    if (activeToolTab === 'terminal' && fitAddonRef.current) setTimeout(() => fitAddonRef.current.fit(), 10);
  }, [activeToolTab]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'CONSOLE_LOG' && xtermInstance.current) {
        xtermInstance.current.writeln(event.data.message);
        xtermInstance.current.write('$ ');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleTerminalCommand = useCallback((cmd) => {
    const term = xtermInstance.current;
    if (!term) return;

    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    const args = trimmedCmd.split(' ');
    const command = args[0].toLowerCase();

    switch (command) {
      case 'help':
        term.writeln('\x1b[1;36mAvailable commands:\x1b[0m'); 
        term.writeln('  \x1b[33mhelp\x1b[0m           - Show this help message');
        term.writeln('  \x1b[33mclear\x1b[0m          - Clear the terminal screen');
        term.writeln('  \x1b[33mls\x1b[0m             - List all files and folders');
        term.writeln('  \x1b[33mcat <file>\x1b[0m     - Display the contents of a file');
        term.writeln('  \x1b[33mecho <text>\x1b[0m    - Print text to the terminal');
        term.writeln('  \x1b[33mdate\x1b[0m           - Display current date and time');
        term.writeln('  \x1b[33mnode <file>\x1b[0m    - Execute a JavaScript file');
        break;
      case 'clear':
        term.write('\x1b[2J\x1b[0;0H');
        break;
      case 'ls':
        if (files.length === 0) {
          term.writeln('Directory is empty.');
        } else {
          files.forEach(f => {
            const color = f.type === 'folder' ? '\x1b[1;34m' : '\x1b[1;32m';
            const icon = f.type === 'folder' ? '📁' : '📄';
            term.writeln(`${color}${icon} ${f.name}\x1b[0m`);
          });
        }
        break;
      case 'cat':
        if (args.length < 2) {
          term.writeln('\x1b[31mError: Usage: cat <filename>\x1b[0m');
        } else {
          const targetFile = files.find(f => f.name === args[1] && f.type === 'file');
          if (targetFile) {
            const lines = targetFile.content.split('\n');
            lines.forEach(line => term.writeln(line));
          } else {
            term.writeln(`\x1b[31mError: File "${args[1]}" not found.\x1b[0m`);
          }
        }
        break;
      case 'echo':
        term.writeln(args.slice(1).join(' '));
        break;
      case 'date':
        term.writeln(new Date().toString());
        break;
      case 'node':
        if (args.length < 2) {
          term.writeln('\x1b[31mError: Usage: node <filename>\x1b[0m');
        } else {
          const fileName = args[1];
          const targetFile = files.find(f => f.name === fileName && f.type === 'file');
          
          if (targetFile && targetFile.language === 'javascript') {
            try {
              const customConsole = {
                log: (...msgArgs) => term.writeln(msgArgs.map(String).join(' ')),
                error: (...msgArgs) => term.writeln(`\x1b[31m${msgArgs.map(String).join(' ')}\x1b[0m`),
                warn: (...msgArgs) => term.writeln(`\x1b[33m${msgArgs.map(String).join(' ')}\x1b[0m`)
              };
              const executeScript = new Function('console', targetFile.content);
              const result = executeScript(customConsole);
              if (result !== undefined) {
                term.writeln(String(result));
              }
            } catch (error) {
              term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
            }
          } else {
            term.writeln(`\x1b[31mError: Cannot find JS file "${fileName}"\x1b[0m`);
          }
        }
        break;
      default:
        term.writeln(`bash: ${command}: command not found`);
    }
  }, [files]);

  useEffect(() => {
    const htmlContent = files.find(f => f.language === 'html')?.content || '';
    const cssContent = files.find(f => f.language === 'css')?.content || '';
    const jsContent = files.find(f => f.language === 'javascript')?.content || '';

    const consoleHijack = `
      <script>
        const originalLog = console.log;
        console.log = function(...args) {
          const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
          window.parent.postMessage({ type: 'CONSOLE_LOG', message: message }, '*');
          originalLog.apply(console, args);
        };
        window.onerror = function(message) {
          window.parent.postMessage({ type: 'CONSOLE_LOG', message: 'Error: ' + message }, '*');
        };
      <\/script>
    `;

    const timeout = setTimeout(() => {
      setSrcDoc(`<!DOCTYPE html><html><head><style>${cssContent}</style>${consoleHijack}</head><body>${htmlContent}<script>${jsContent}<\/script></body></html>`);
    }, 250);
    return () => clearTimeout(timeout);
  }, [files]);

  // --- FILE/FOLDER MANAGEMENT ---
  const handleCreateFile = (parentId = null) => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    let language = 'javascript';
    if (fileName.endsWith('.html')) language = 'html';
    if (fileName.endsWith('.css')) language = 'css';
    
    const startingContent = language === 'html' 
      ? '\n'.concat('\n'.repeat(14))
      : '// Start coding here\n'.concat('\n'.repeat(14));

    const newFile = { id: Date.now().toString(), name: fileName, type: 'file', parentId, language, content: startingContent };
    setFiles([...files, newFile]);
    setOpenFileIds([...openFileIds, newFile.id]);
    setActiveFileId(newFile.id);
  };

  const handleCreateFolder = (parentId = null) => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    const newFolder = { id: Date.now().toString(), name: folderName, type: 'folder', parentId };
    setFiles([...files, newFolder]);
  };

  const handleImport = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    const newItems = [];
    const folderMap = new Map(); 

    for (const file of uploadedFiles) {
      const path = file.webkitRelativePath || file.name;
      const pathParts = path.split('/');
      const fileName = pathParts.pop(); 

      let currentParentId = null;
      let currentPath = "";

      for (const folderName of pathParts) {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!folderMap.has(currentPath)) {
          const existingFolder = files.find(f => f.type === 'folder' && f.name === folderName && f.parentId === currentParentId);
          let folderId = existingFolder ? existingFolder.id : Date.now().toString() + Math.random().toString(36).substr(2, 9);
          
          if (!existingFolder) {
            newItems.push({ id: folderId, name: folderName, type: 'folder', parentId: currentParentId });
          }
          folderMap.set(currentPath, folderId);
        }
        currentParentId = folderMap.get(currentPath);
      }

      // --- NEW: Image Detection & Reading Logic ---
      const isImage = fileName.match(/\.(jpeg|jpg|gif|png|svg|webp|ico)$/i);
      let content = '';
      let language = 'javascript';

      if (isImage) {
        // Read as a Base64 Data URL so we can put it directly into an <img src="...">
        content = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });
        language = 'image';
      } else {
        // Read as normal text for CodeMirror
        content = await file.text();
        if (fileName.endsWith('.html')) language = 'html';
        else if (fileName.endsWith('.css')) language = 'css';
        else if (fileName.endsWith('.json')) language = 'json';
      }

      newItems.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: fileName,
        type: 'file',
        parentId: currentParentId,
        language,
        content,
        isImage: !!isImage // Store a boolean flag to make rendering easier
      });
    }

    setFiles(prevFiles => [...prevFiles, ...newItems]);
    e.target.value = '';
  };

  const handleOpenFile = (id) => {
    if (!openFileIds.includes(id)) setOpenFileIds([...openFileIds, id]);
    setActiveFileId(id);
  };

  const handleCloseTab = (e, idToClose) => {
    e.stopPropagation();
    const newOpenFiles = openFileIds.filter(id => id !== idToClose);
    setOpenFileIds(newOpenFiles);
    if (activeFileId === idToClose) setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
  };

  const handleDeleteFileFromSystem = (e, idToDelete) => {
    e.stopPropagation();
    if (!window.confirm("Delete this item? (Folders will delete all contents inside)")) return;
    
    const getAllChildIds = (id) => {
      const children = files.filter(f => f.parentId === id);
      let ids = [id];
      children.forEach(child => { ids = [...ids, ...getAllChildIds(child.id)]; });
      return ids;
    };

    const idsToDelete = getAllChildIds(idToDelete);
    setFiles(files.filter(f => !idsToDelete.includes(f.id)));
    
    const newOpenFiles = openFileIds.filter(id => !idsToDelete.includes(id));
    setOpenFileIds(newOpenFiles);
    if (idsToDelete.includes(activeFileId)) setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
  };

  const handleEditorChange = useCallback((value) => {
    if (!activeFileId) return;
    setFiles(prevFiles => prevFiles.map(file => file.id === activeFileId ? { ...file, content: value } : file));
  }, [activeFileId]);

  const handleDownloadProject = async () => {
    if (files.length === 0) return alert("No files to download!");
    const zip = new JSZip();
    
    const getFilePath = (file) => {
      let path = file.name;
      let currentParentId = file.parentId;
      while (currentParentId) {
        const parent = files.find(f => f.id === currentParentId);
        if (parent) {
          path = parent.name + '/' + path;
          currentParentId = parent.parentId;
        } else break;
      }
      return path;
    };

    files.forEach(file => {
      if (file.type === 'file') {
        zip.file(getFilePath(file), file.content);
      } else {
        zip.folder(getFilePath(file));
      }
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'my-web-project.zip');
    } catch (error) {
      alert("Failed to download project.");
    }
  };

  const handleLayoutResize = () => {
    if (activeToolTab === 'terminal' && fitAddonRef.current) fitAddonRef.current.fit();
  };

  return (
    <div className="app-container">
      {/* --- ADDED MODAL HERE --- */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        settings={settings} 
        setSettings={setSettings} 
      />

      <Header 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        handleDownloadProject={handleDownloadProject} 
        openSettings={() => setIsSettingsModalOpen(true)} /* Pass the trigger to the header */
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {isSidebarOpen && (
          <Sidebar 
            files={files} 
            activeFileId={activeFileId} 
            handleOpenFile={handleOpenFile} 
            handleCreateFile={handleCreateFile} 
            handleCreateFolder={handleCreateFolder} 
            handleDeleteFileFromSystem={handleDeleteFileFromSystem} 
            handleImport={handleImport} /* <-- Add this line! */
          />
        )}

        <Group id="main-workspace" orientation="horizontal" className="workspace" onLayout={handleLayoutResize}>
          <Panel id="editor-panel" defaultSize={60} minSize={20}>
            <EditorPanel 
              files={files}
              openFileIds={openFileIds}
              activeFile={activeFile}
              activeFileId={activeFileId}
              setActiveFileId={setActiveFileId}
              handleCloseTab={handleCloseTab}
              handleEditorChange={handleEditorChange}
              settings={settings} /* <-- Passing settings to EditorPanel! */
            />
          </Panel>
          <Separator className="resize-handle" />
          <Panel id="tools-panel" defaultSize={40} minSize={20}>
            <ToolsPanel 
              activeToolTab={activeToolTab}
              setActiveToolTab={setActiveToolTab}
              srcDoc={srcDoc}
              handleTerminalCommand={handleTerminalCommand}
              fitAddonRef={fitAddonRef}
              xtermInstance={xtermInstance}
            />
          </Panel>
        </Group>
      </div>
    </div>
  );
}

export default App;