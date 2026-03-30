import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export default function ToolsPanel({ activeToolTab, setActiveToolTab, srcDoc, handleTerminalCommand, fitAddonRef, xtermInstance }) {
  const terminalRef = useRef(null);
  const currentCommand = useRef('');
  
  // 1. THE BRIDGE: Create a ref to always hold the absolute latest version of the command handler
  const latestCmdHandler = useRef(handleTerminalCommand);

  // 2. Keep the bridge updated every time the files change
  useEffect(() => {
    latestCmdHandler.current = handleTerminalCommand;
  }, [handleTerminalCommand]);

  // Initialize Terminal on Mount
  useEffect(() => {
    if (!terminalRef.current || xtermInstance.current) return;

    const term = new Terminal({
      theme: { background: '#1e1e1e' },
      cursorBlink: true,
      fontFamily: 'monospace',
    });
    
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    setTimeout(() => {
      fitAddon.fit();
      term.writeln('Welcome to the Web Editor Terminal!');
      term.writeln('Try typing "help" for list of commands');
      term.writeln('');
      term.write('$ ');
    }, 10);

    xtermInstance.current = term;

    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.altGraphKey && !domEvent.ctrlKey && !domEvent.metaKey;
      
      if (domEvent.keyCode === 13) { 
        term.write('\r\n');
        
        // 3. THE FIX: Call the function from the ref, which guarantees it has the latest file state!
        latestCmdHandler.current(currentCommand.current.trim());
        
        currentCommand.current = '';
        term.write('$ ');
      } else if (domEvent.keyCode === 8) { 
        if (currentCommand.current.length > 0) {
          term.write('\b \b');
          currentCommand.current = currentCommand.current.slice(0, -1);
        }
      } else if (printable) {
        term.write(key);
        currentCommand.current += key;
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tools-pane">
      <div className="tabs tool-tabs">
        <div 
          onClick={() => setActiveToolTab('preview')} 
          className={`tab ${activeToolTab === 'preview' ? 'active' : ''}`}
        >
          Output
        </div>
        <div 
          onClick={() => setActiveToolTab('terminal')} 
          className={`tab ${activeToolTab === 'terminal' ? 'active' : ''}`}
        >
          Terminal
        </div>
      </div>
      <div className="tools-content">
        <iframe
          srcDoc={srcDoc}
          title="output"
          sandbox="allow-scripts allow-same-origin"
          className={`preview-iframe ${activeToolTab === 'preview' ? 'visible' : 'hidden'}`}
        />
        <div 
          ref={terminalRef} 
          className={`terminal-container ${activeToolTab === 'terminal' ? 'visible' : 'hidden'}`}
        />
      </div>
    </div>
  );
}